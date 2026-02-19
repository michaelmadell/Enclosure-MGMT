// API utilities for CMC operations with Bearer token authentication

import { storage } from './storage';
import { buildApiUrl } from './proxy';

/**
 * Get or refresh authentication token
 */
const getAuthToken = async (cmc) => {
  // Check if we have a valid cached token
  const cachedToken = storage.getToken(cmc.id);
  if (cachedToken) {
    return { success: true, token: cachedToken };
  }

  // Need to fetch a new token
  try {
    const url = buildApiUrl(cmc.address, '/api/auth/token');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: cmc.username,
        password: cmc.password
      })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      throw new Error('No access token in response');
    }

    // Save token to storage
    storage.saveToken(cmc.id, data.accessToken);

    return { success: true, token: data.accessToken };
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Make authenticated API request with automatic token refresh
 */
const authenticatedFetch = async (cmc, endpoint, options = {}) => {
  const authResult = await getAuthToken(cmc);
  
  if (!authResult.success) {
    return { success: false, error: `Authentication failed: ${authResult.error}` };
  }

  try {
    const url = buildApiUrl(cmc.address, endpoint);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${authResult.token}`,
        'Content-Type': 'application/json'
      }
    });

    // If we get 401, token might be expired - try once more with fresh token
    if (response.status === 401) {
      console.log('Token expired, refreshing...');
      storage.clearToken(cmc.id);
      
      const refreshResult = await getAuthToken(cmc);
      if (!refreshResult.success) {
        throw new Error('Token refresh failed');
      }

      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${refreshResult.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
      }

      return retryResponse;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Fetch events from CMC
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
    return { success: true, data: data.items || [] };
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch firmware history
 */
export const fetchFirmwareHistory = async (cmc) => {
  try {
    console.log('fetchFirmwareHistory: Starting fetch for CMC', cmc.id);
    
    const response = await authenticatedFetch(
      cmc,
      '/api/interface/firmware',
      { method: 'GET' }
    );

    const data = await response.json();
    console.log('fetchFirmwareHistory: Raw response:', data);
    
    if (!data.firmwareData || !Array.isArray(data.firmwareData)) {
      console.error('fetchFirmwareHistory: Invalid data format:', data);
      throw new Error('Invalid firmware data format');
    }

    console.log('fetchFirmwareHistory: Returning', data.firmwareData.length, 'firmware items');
    return { success: true, data: data.firmwareData };
  } catch (error) {
    console.error('Failed to fetch firmware history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Perform power action on enclosure or node
 */
export const performPowerAction = async (cmc, action, component = 'enclosure', id = null) => {
  try {
    const payload = id 
      ? { component, id, action }
      : { component, action };

    await authenticatedFetch(
      cmc,
      '/api/interface/power-action',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Power action failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Schedule a power action
 */
export const schedulePowerAction = async (cmc, action, component, id, scheduleTime) => {
  try {
    const payload = {
      component,
      id,
      action,
      schedule_time: scheduleTime
    };

    await authenticatedFetch(
      cmc,
      '/api/interface/schedule-power-action',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Schedule power action failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set fan speed
 */
export const setFanSpeed = async (cmc, speed) => {
  try {
    await authenticatedFetch(
      cmc,
      '/api/interface/fan-speed',
      {
        method: 'POST',
        body: JSON.stringify({ speed })
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Set fan speed failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle SSH
 */
export const toggleSsh = async (cmc, enabled) => {
  try {
    await authenticatedFetch(
      cmc,
      '/api/interface/toggle-ssh',
      {
        method: 'POST',
        body: JSON.stringify({ enabled })
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Toggle SSH failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle serial console access
 */
export const toggleSerial = async (cmc, enabled) => {
  try {
    await authenticatedFetch(
      cmc,
      '/api/interface/toggle-serial',
      {
        method: 'POST',
        body: JSON.stringify({ enabled })
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Toggle Serial failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch core station state (enclosure, nodes, PSUs, fans, etc.)
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
    console.error('Failed to fetch core state:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Start LED blink
 */
export const startBlink = async (cmc, component, id, duration = 60) => {
  try {
    await authenticatedFetch(
      cmc,
      '/api/interface/start-blink',
      {
        method: 'POST',
        body: JSON.stringify({ component, id, duration })
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Start blink failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test authentication - useful for verifying credentials
 */
export const testAuthentication = async (cmc) => {
  try {
    const authResult = await getAuthToken(cmc);
    return authResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Manually refresh token for a CMC
 */
export const refreshToken = async (cmc) => {
  storage.clearToken(cmc.id);
  return await getAuthToken(cmc);
};