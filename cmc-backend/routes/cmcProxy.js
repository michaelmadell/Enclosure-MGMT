import express from 'express';
import fetch from 'node-fetch';
import https from 'https';

const router = express.Router();

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Helper to normalize CMC address to use https if needed
 */
function normalizeAddress(address) {
  // If address starts with http://, try https:// instead
  // Many CMCs redirect http to https
  if (address.startsWith('http://')) {
    return address.replace('http://', 'https://');
  }
  return address;
}

/**
 * Proxy requests to CMC devices
 * POST /api/cmc-proxy
 * Body: { cmcAddress, endpoint, method, body, cmcUsername, cmcPassword }
 */
router.post('/', async (req, res) => {
  try {
    const { cmcAddress, endpoint, method = 'GET', body, cmcUsername, cmcPassword } = req.body;

    if (!cmcAddress || !endpoint) {
      return res.status(400).json({ error: 'cmcAddress and endpoint are required' });
    }

    // Normalize address to use HTTPS (CMCs typically use HTTPS)
    const normalizedAddress = normalizeAddress(cmcAddress);
    console.log(`🔄 Proxying ${method} ${normalizedAddress}${endpoint}`);

    // First, get auth token from CMC device
    let cmcToken = null;
    
    if (cmcUsername && cmcPassword) {
      try {
        console.log(`🔐 Authenticating to CMC: ${normalizedAddress}`);
        const authResponse = await fetch(`${normalizedAddress}/api/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cmcUsername, password: cmcPassword }),
          agent: httpsAgent, // Always use HTTPS agent since CMCs use HTTPS
          redirect: 'follow',
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          cmcToken = authData.accessToken;
          console.log('✅ CMC authentication successful');
        } else {
          const errorText = await authResponse.text();
          console.log(`❌ CMC authentication failed: ${authResponse.status} - ${errorText}`);
          return res.status(401).json({ 
            error: 'CMC authentication failed',
            details: errorText 
          });
        }
      } catch (authError) {
        console.error('❌ CMC auth error:', authError.message);
        return res.status(500).json({ 
          error: 'Failed to authenticate with CMC',
          details: authError.message 
        });
      }
    }

    // Make the actual request to CMC device
    const url = `${normalizedAddress}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cmcToken && { 'Authorization': `Bearer ${cmcToken}` }),
      },
      agent: httpsAgent, // Always use HTTPS agent
      redirect: 'follow',
      ...(body && { body: JSON.stringify(body) }),
    };

    console.log(`📡 Fetching: ${url}`);
    const response = await fetch(url, options);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { response: text };
    }

    if (!response.ok) {
      console.log(`❌ CMC request failed: ${response.status}`);
      return res.status(response.status).json(data);
    }

    console.log(`✅ CMC request successful`);
    res.json(data);
  } catch (error) {
    console.error('❌ CMC proxy error:', error);
    res.status(500).json({ 
      error: 'CMC proxy request failed',
      details: error.message 
    });
  }
});

export default router;