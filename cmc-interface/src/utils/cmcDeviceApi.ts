import type { Cmc, CmcEvent, FirmwareEntry } from '../types';

const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:3001';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// Token cache structure: { cmcId: { token: string, expiresAt: timestamp, address: string } }
const TOKEN_CACHE_KEY = 'cmc-device-tokens';
const TOKEN_LIFETIME = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get cached token info for a CMC
 */
function getCachedToken(cmcId: string) {
  try {
    const cache = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!cache) return null;
    
    const tokens = JSON.parse(cache);
    const tokenData = tokens[cmcId];
    
    if (!tokenData) return null;
    
    // Check if token is expired
    const now = Date.now();
    if (now >= tokenData.expiresAt) {
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
function saveCachedToken(cmcId: string, address: string) {
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
function deleteCachedToken(cmcId: string) {
  try {
    const cache = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!cache) return;
    
    const tokens = JSON.parse(cache);
    delete tokens[cmcId];
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(tokens));
    
    window.dispatchEvent(new CustomEvent('cmc-token-updated', { 
      detail: { cmcId, expiresAt: null } 
    }));
  } catch (error: unknown) {
    console.error('Error deleting token cache:', error);
  }
}

/**
 * Get time remaining until token expires
 */
export function getTokenTimeRemaining(cmcId: string) {
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
 * Get a new token from the CMC device via our backend proxy.
 * Always throws on failure — never returns a plain error object —
 * so callers can safely call .json() on the returned Response.
 */
async function getNewCmcToken(cmc: Cmc) {
  try {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      throw new Error('Not authenticated to backend');
    }

    console.log('🔐 Getting new CMC device token...');

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
          "username": cmc.username,
          "password": cmc.password,
        }
        ,cmcUsername: cmc.username,
        cmcPassword: cmc.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ CMC device token obtained successfully');
    
    saveCachedToken(cmc.id, cmc.address);
    
    return { success: true, token: data.accessToken };
  } catch (error: unknown) {
    console.error('❌ Failed to get CMC device token:', error);
    return { success: false, error: getErrorMessage(error, 'Token request failed') };
  }
}

/**
 * Manually refresh token (force new token from CMC)
 */
export const refreshToken = async (cmc: Cmc) => {
  try {
    console.log('🔄 Manually refreshing CMC token...');
    deleteCachedToken(cmc.id);
    const result = await getNewCmcToken(cmc);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Token refresh failed') };
  }
};

/**
 * Make authenticated API request to a CMC device via backend proxy.
 * Always returns a fetch Response or throws — never returns a plain object.
 */
const authenticatedFetch = async (cmc: Cmc, endpoint: string, options: { method?: string; body?: unknown } = {}) => {
  try {
    const cachedToken = getCachedToken(cmc.id);
    
    if (!cachedToken) {
      console.log('📝 No valid token, getting new one...');
      const tokenResult = await getNewCmcToken(cmc);
      if (!tokenResult.success) {
        throw new Error(`Token acquisition failed: ${tokenResult.error}`);
      }
    }

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    console.log(`📡 CMC API Request: ${endpoint}`);

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
        body: typeof options.body === 'string' ? JSON.parse(options.body) : options.body,
        cmcUsername: cmc.username,
        cmcPassword: cmc.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 401) {
        console.log('🔄 CMC token expired, refreshing...');
        deleteCachedToken(cmc.id);
        const tokenResult = await getNewCmcToken(cmc);
        
        if (tokenResult.success) {
          return authenticatedFetch(cmc, endpoint, options);
        }
      }
      
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    saveCachedToken(cmc.id, cmc.address);
    return response;
  } catch (error: unknown) {
    console.error('CMC device API request failed:', error);
    throw error;
  }
};

/**
 * Fetch core state from CMC device
 */
export const fetchCoreState = async (cmc: Cmc) => {
  try {
    const response = await authenticatedFetch(cmc, '/api/corestation/state', { method: 'GET' });
    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to fetch core state') };
  }
};

/**
 * Fetch events from CMC device
 */
export const fetchEvents = async (cmc: Cmc, limit = 50, textFilter: string | null = null, severityFilter: string | null = null) => {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (textFilter) params.append('text_filter', textFilter);
    if (severityFilter) params.append('severity_filter', severityFilter);

    const response = await authenticatedFetch(
      cmc,
      `/api/interface/events?${params}`,
      { method: 'GET' }
    );

    const data: unknown = await response.json();
    const rawEvents = Array.isArray(data)
      ? data
      : (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : []);

    const normalizedEvents: CmcEvent[] = rawEvents.filter((event): event is CmcEvent => {
      if (!event || typeof event !== 'object') return false;
      const candidate = event as Partial<CmcEvent>;
      return typeof candidate.message === 'string' && typeof candidate.timestamp === 'string';
    });

    return { success: true, data: normalizedEvents };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to fetch events') };
  }
};

/**
 * Fetch firmware history from CMC device
 */
export const fetchFirmwareHistory = async (cmc: Cmc) => {
  try {
    console.log('fetchFirmwareHistory: Starting fetch for CMC', cmc.id);

    const response = await authenticatedFetch(
      cmc,
      '/api/interface/firmware',
      { method: 'GET' }
    );

    const data: unknown = await response.json();
    console.log('fetchFirmwareHistory: Raw response:', data);

    const payload = (data && typeof data === 'object') ? data as Record<string, unknown> : {};
    const rawFirmwareData = Array.isArray(payload.firmwareData)
      ? payload.firmwareData
      : Array.isArray(payload.history)
        ? payload.history
        : [];

    const normalizedFirmwareData: FirmwareEntry[] = rawFirmwareData
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const entry = item as Record<string, unknown>;

        const version = typeof entry.version === 'string' ? entry.version : null;
        const packageDate = typeof entry.packageDate === 'string'
          ? entry.packageDate
          : (typeof entry.date === 'string' ? entry.date : null);
        const installDate = typeof entry.installDate === 'string'
          ? entry.installDate
          : (typeof entry.date === 'string' ? entry.date : null);

        if (!version || !packageDate || !installDate) return null;

        return {
          version,
          packageDate,
          installDate,
        };
      })
      .filter((item): item is FirmwareEntry => item !== null);

    console.log('fetchFirmwareHistory: Returning', normalizedFirmwareData.length, 'items');
    return { success: true, data: normalizedFirmwareData };
  } catch (error: unknown) {
    console.error('Failed to fetch firmware history:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch firmware history') };
  }
};

/**
 * Perform power action on CMC device
 */
export const performPowerAction = async (cmc: Cmc, action: string) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/power-action',
      {
        method: 'POST',
        body: JSON.stringify({ id: 1, component: 'node', action })
      }
    );
    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to perform power action') };
  }
};

/**
 * Start LED blink on CMC device
 */
export const startBlink = async (cmc: Cmc, target: string, targetId: number | null = null, duration: number = 60) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/start-blink',
      {
        method: 'POST',
        body: JSON.stringify({ id: targetId || 1, component: target, duration })
      }
    );
    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to start blink') };
  }
};

/**
 * Set fan speed on CMC device
 */
export const setFanSpeed = async (cmc: Cmc, speed: number) => {
  try {
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/fan-speed',
      {
        method: 'POST',
        body: JSON.stringify({ id: 1, mode: 'fixed', speed })
      }
    );
    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to set fan speed') };
  }
};

/**
 * Toggle SSH on CMC device
 */
export const toggleSsh = async (cmc: Cmc, enabled: boolean) => {
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
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to toggle SSH') };
  }
};

/**
 * Toggle serial on CMC device
 */
export const toggleSerial = async (cmc: Cmc, enabled: boolean) => {
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
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to toggle serial') };
  }
};