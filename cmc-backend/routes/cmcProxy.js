import express from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

/**
 * Make an HTTP/HTTPS request using Node's built-in modules.
 * Accepts self-signed certificates (rejectUnauthorized: false).
 */
function makeRequest(url, options = {}, body = null) {
  const maxRedirects = typeof options.maxRedirects === 'number' ? options.maxRedirects : 5;
  const redirectCount = typeof options.redirectCount === 'number' ? options.redirectCount : 0;

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    // Serialise body up front so we know its exact byte length.
    // Content-Length is required by many HTTP/1.1 servers — without it
    // the server cannot delimit the request body and returns 411 or 422.
    const serialisedBody = body
      ? (typeof body === 'string' ? body : JSON.stringify(body))
      : null;

    const headers = { ...options.headers };
    if (serialisedBody) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      headers['Content-Length'] = Buffer.byteLength(serialisedBody);
    }

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers,
      rejectUnauthorized: false,
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const isRedirect = [301, 302, 303, 307, 308].includes(res.statusCode);
        const locationHeader = res.headers.location;

        if (isRedirect && locationHeader) {
          if (redirectCount >= maxRedirects) {
            return reject(new Error(`Too many redirects while requesting ${url}`));
          }

          const redirectUrl = new URL(locationHeader, parsed).toString();
          const nextMethod = (res.statusCode === 303 || ((res.statusCode === 301 || res.statusCode === 302) && (options.method || 'GET') !== 'GET'))
            ? 'GET'
            : (options.method || 'GET');
          const nextBody = nextMethod === 'GET' ? null : body;

          return makeRequest(
            redirectUrl,
            {
              ...options,
              method: nextMethod,
              redirectCount: redirectCount + 1,
              maxRedirects,
            },
            nextBody
          ).then(resolve).catch(reject);
        }

        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
          text: () => Promise.resolve(data),
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data));
            } catch (e) {
              return Promise.reject(new Error(`Failed to parse JSON: ${data}`));
            }
          },
        });
      });
    });

    req.on('error', reject);

    if (serialisedBody) {
      req.write(serialisedBody);
    }

    req.end();
  });
}

/**
 * Proxy requests to CMC devices.
 * POST /api/cmc-proxy
 * Body: { cmcAddress, endpoint, method, body, cmcUsername, cmcPassword }
 */
router.post('/', async (req, res) => {
  try {
    const { cmcAddress, endpoint, method = 'GET', body, cmcUsername, cmcPassword } = req.body;

    if (!cmcAddress || !endpoint) {
      return res.status(400).json({ error: 'cmcAddress and endpoint are required' });
    }

    const normalizedAddress = cmcAddress.trim().replace(/\/$/, '');
    const hasProtocol = normalizedAddress.startsWith('http://') || normalizedAddress.startsWith('https://');
    const baseCandidates = hasProtocol
      ? [normalizedAddress]
      : [`https://${normalizedAddress}`, `http://${normalizedAddress}`];

    const makeWithFallback = async (urlBuilder, requestOptions, requestBody) => {
      let lastError = null;

      for (let index = 0; index < baseCandidates.length; index += 1) {
        const candidate = baseCandidates[index];
        try {
          const response = await makeRequest(urlBuilder(candidate), requestOptions, requestBody);
          return { response, baseAddress: candidate };
        } catch (error) {
          lastError = error;
          const hasAnotherCandidate = index < baseCandidates.length - 1;
          if (hasAnotherCandidate) {
            console.warn(`Request to ${candidate} failed (${error.message}), trying next protocol candidate`);
          }
        }
      }

      throw lastError;
    };

    console.log(`Proxying ${method} ${baseCandidates[0]}${endpoint}`);
    console.log(`Auth fields received — cmcUsername: "${cmcUsername}", cmcPassword length: ${cmcPassword?.length ?? 'undefined'}`);

    // Step 1: authenticate to the CMC device
    let cmcToken = null;

    if (cmcUsername && cmcPassword) {
      console.log(`Authenticating to CMC: ${baseCandidates[0]}`);

      const authBody = { "username": cmcUsername, "password": cmcPassword };
      console.log(`Auth body being sent: ${JSON.stringify(authBody)}`);

      const { response: authRes, baseAddress } = await makeWithFallback(
        candidateBase => `${candidateBase}/api/auth/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        authBody
      );

      console.log(`CMC auth request resolved using base address: ${baseAddress}`);

      if (!authRes.ok) {
        const errText = await authRes.text();
        console.log(`CMC auth failed: ${authRes.status} - ${errText}`);
        return res.status(401).json({
          error: 'CMC authentication failed',
          details: errText,
        });
      }

      const authData = await authRes.json();
      cmcToken = authData.accessToken;
      console.log('CMC authentication successful');

      // If the requested endpoint IS the auth endpoint, step 1 is the whole
      // job (e.g. "Test Connection" in the UI). Return the auth result now
      // so we don't make a second bodyless POST to /api/auth/token.
      if (endpoint === '/api/auth/token') {
        return res.json(authData);
      }
    }

    // Step 2: forward the actual request
    const primaryBaseAddress = baseCandidates[0];
    const url = `${primaryBaseAddress}${endpoint}`;

    const headers = { 'Content-Type': 'application/json' };
    if (cmcToken) headers['Authorization'] = `Bearer ${cmcToken}`;

    console.log(`Fetching: ${url}`);

    const { response, baseAddress } = await makeWithFallback(
      candidateBase => `${candidateBase}${endpoint}`,
      { method, headers },
      body || null
    );

    console.log(`CMC request resolved using base address: ${baseAddress}`);

    const contentType = response.headers['content-type'] || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { response: await response.text() };
    }

    if (!response.ok) {
      console.log(`CMC request failed: ${response.status}`);
      return res.status(response.status).json(data);
    }

    console.log('CMC request successful');
    res.json(data);
  } catch (error) {
    console.error('CMC proxy error:', error);
    res.status(500).json({
      error: 'CMC proxy request failed',
      details: error.message,
    });
  }
});

export default router;