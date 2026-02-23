import express from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

/**
 * Make an HTTP/HTTPS request using Node's built-in modules.
 * Accepts self-signed certificates (rejectUnauthorized: false).
 */
function makeRequest(url, options = {}, body = null) {
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

    // Normalise to HTTPS — CMC devices typically redirect HTTP -> HTTPS anyway
    const baseAddress = cmcAddress.startsWith('http://')
      ? cmcAddress.replace('http://', 'https://')
      : cmcAddress;

    console.log(`Proxying ${method} ${baseAddress}${endpoint}`);
    console.log(`Auth fields received — cmcUsername: "${cmcUsername}", cmcPassword length: ${cmcPassword?.length ?? 'undefined'}`);

    // Step 1: authenticate to the CMC device
    let cmcToken = null;

    if (cmcUsername && cmcPassword) {
      console.log(`Authenticating to CMC: ${baseAddress}`);

      const authBody = { "username": cmcUsername, "password": cmcPassword };
      console.log(`Auth body being sent: ${JSON.stringify(authBody)}`);

      const authRes = await makeRequest(
        `${baseAddress}/api/auth/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        authBody
      );

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
    const url = `${baseAddress}${endpoint}`;

    const headers = { 'Content-Type': 'application/json' };
    if (cmcToken) headers['Authorization'] = `Bearer ${cmcToken}`;

    console.log(`Fetching: ${url}`);

    const response = await makeRequest(
      url,
      { method, headers },
      body || null
    );

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