import { API_BASE_URL } from '../config';

// Token cache structure: { cmcId: { token: string, expiresAt: timestamp, address: string } }
const TOKEN_CACHE_KEY = 'cmc-device-tokens';
const TOKEN_LIFETIME = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get cached token info for a CMC
 */
function getCachedToken(cmcId) {
  try {
    const cache = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!cache) return null;
    
    const tokens = JSON.parse(cache);
    const tokenData = tokens[cmcId];
    
    if (!tokenData) return null;
    
    // Check if token is expired
    const now = Date.now();
    if (now >= tokenData.expiresAt) {
      // Token expired, remove it
      deleteCachedToken(cmcId);
      return null;
    }
    
    return tokenData;
  } catch (error) {
    console.error('Error reading token cache:', error);
    return null;
  }
}

/**
 * Save token to cache
 */
function saveCachedToken(cmcId, address) {
  try {
    const cache = localStorage.getItem(TOKEN_CACHE_KEY);
    const tokens = cache ? JSON.parse(cache) : {};
    
    const now = Date.now();
    tokens[cmcId] = {
      address,
      expiresAt: now + TOKEN_LIFETIME,
      createdAt: now,
    };
    
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(tokens));
    
    // Dispatch event for TokenStatus to listen to
    window.dispatchEvent(new CustomEvent('cmc-token-updated', { 
      detail: { cmcId, expiresAt: tokens[cmcId].expiresAt } 
    }));
  } catch (error) {
    console.error('Error saving token cache:', error);
  }
}

/**
 * Delete cached token
 */
function deleteCachedToken(cmcId) {
  try {
    const cache = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!cache) return;
    
    const tokens = JSON.parse(cache);
    delete tokens[cmcId];
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(tokens));
    
    window.dispatchEvent(new CustomEvent('cmc-token-updated', { 
      detail: { cmcId, expiresAt: null } 
    }));
  } catch (error) {
    console.error('Error deleting token cache:', error);
  }
}

/**
 * Get time remaining until token expires
 */
export function getTokenTimeRemaining(cmcId) {
  const tokenData = getCachedToken(cmcId);
  if (!tokenData) return null;
  
  const now = Date.now();
  const remaining = tokenData.expiresAt - now;
  
  return {
    milliseconds: remaining,
    minutes: Math.floor(remaining / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
    expiresAt: tokenData.expiresAt,
    createdAt: tokenData.createdAt,
  };
}

/**
 * Get a new token from the CMC device via our backend proxy
 */
async function getNewCmcToken(cmc) {
  try {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      throw new Error('Not authenticated to backend');
    }

    console.log('🔐 Getting new CMC device token...');

    // Use our backend proxy to get token from CMC device
    const response = await fetch(`${API_BASE_URL}/api/cmc-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        cmcAddress: cmc.address,
        endpoint: '/api/auth/token',
        method: 'POST',
        body: {
          username: cmc.username,
          password: cmc.password,
        },
        cmcUsername: cmc.username,
        cmcPassword: cmc.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ CMC device token obtained successfully');
    
    // Save the new token with expiry time
    saveCachedToken(cmc.id, cmc.address);
    
    return { success: true, token: data.accessToken };
  } catch (error) {
    console.error('❌ Failed to get CMC device token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually refresh token (force new token from CMC)
 */
export const refreshToken = async (cmc) => {
  try {
    console.log('🔄 Manually refreshing CMC token...');
    
    // Delete cached token to force refresh
    deleteCachedToken(cmc.id);
    
    // Get a new token from CMC device
    const result = await getNewCmcToken(cmc);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Make authenticated API request to a CMC device via backend proxy
 */
const authenticatedFetch = async (cmc, endpoint, options = {}) => {
  try {
    // Check if we have a valid cached token
    const cachedToken = getCachedToken(cmc.id);
    
    // If no token or token expired, get a new one
    if (!cachedToken) {
      console.log('📝 No valid token, getting new one...');
      const tokenResult = await getNewCmcToken(cmc);
      if (!tokenResult.success) {
        throw new Error(`Token acquisition failed: ${tokenResult.error}`);
      }
    }

    // Get the auth token for OUR backend (not the CMC device)
    const authToken = localStorage.getItem('auth_token');
    
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    console.log(`📡 CMC API Request: ${endpoint}`);

    // Send request to our backend proxy
    const response = await fetch(`${API_BASE_URL}/api/cmc-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        cmcAddress: cmc.address,
        endpoint: endpoint,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : undefined,
        cmcUsername: cmc.username,
        cmcPassword: cmc.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // If CMC token expired (401), get a new one and retry
      if (response.status === 401) {
        console.log('🔄 CMC token expired, refreshing...');
        deleteCachedToken(cmc.id);
        const tokenResult = await getNewCmcToken(cmc);
        
        if (tokenResult.success) {
          // Retry the request with new token
          return authenticatedFetch(cmc, endpoint, options);
        }
      }
      
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    // Update token cache on successful request (refresh the expiry time)
    saveCachedToken(cmc.id, cmc.address);

    return response;
  } catch (error) {
    console.error('CMC device API request failed:', error);
    throw error;
  }
};

/**
 * Fetch core state from CMC device
 */
export const fetchCoreState = async (cmc) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/corestation/state',
      { method: 'GET' }
    );

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Perform power action on CMC device
 */
export const performPowerAction = async (cmc, action) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/power-action',
      {
        method: 'POST',
        body: JSON.stringify({ 
          id: 1, // Node ID
          component: 'node',
          action: action 
        })
      }
    );

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Start LED blink on CMC device
 */
export const startBlink = async (cmc, target, targetId = null, duration = 60) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/start-blink',
      {
        method: 'POST',
        body: JSON.stringify({ 
          id: targetId || 1,
          component: target,
          duration 
        })
      }
    );

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Set fan speed on CMC device
 */
export const setFanSpeed = async (cmc, speed) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/fan-speed',
      {
        method: 'POST',
        body: JSON.stringify({ 
          id: 1,
          mode: 'fixed',
          speed 
        })
      }
    );

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Toggle SSH on CMC device
 */
export const toggleSsh = async (cmc, enabled) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/toggle-ssh',
      {
        method: 'POST',
        body: JSON.stringify({ enabled })
      }
    );

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Toggle serial on CMC device
 */
export const toggleSerial = async (cmc, enabled) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/toggle-serial',
      {
        method: 'POST',
        body: JSON.stringify({ enabled })
      }
    );

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Fetch events from CMC device
 */
export const fetchEvents = async (cmc, limit = 50, textFilter = null, severityFilter = null) => {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (textFilter) params.append('text_filter', textFilter);
    if (severityFilter) params.append('severity_filter', severityFilter);

    const response = await authenticatedFetch(
      cmc,
      `/api/interface/events?${params}`,
      { method: 'GET' }
    );

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};