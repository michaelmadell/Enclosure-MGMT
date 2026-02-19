// Local storage utilities for CMC data

const STORAGE_KEYS = {
  CMCS: 'cmc-central-manager-cmcs',
  TOKENS: 'cmc-central-manager-tokens'
};

export const storage = {
  // Get all CMCs from localStorage
  getCmcs: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CMCS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load CMCs from storage:', error);
      return [];
    }
  },

  // Save CMCs to localStorage
  saveCmcs: (cmcs) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CMCS, JSON.stringify(cmcs));
      return true;
    } catch (error) {
      console.error('Failed to save CMCs to storage:', error);
      return false;
    }
  },

  // Get token for a specific CMC
  getToken: (cmcId) => {
    try {
      const tokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      if (!tokens) return null;
      
      const tokenMap = JSON.parse(tokens);
      const tokenData = tokenMap[cmcId];
      
      if (!tokenData) return null;
      
      // Check if token is expired (give 1 minute buffer before 15 min expiry)
      const expiresAt = new Date(tokenData.expiresAt);
      const now = new Date();
      const bufferTime = 60 * 1000; // 1 minute buffer
      
      if (now >= new Date(expiresAt.getTime() - bufferTime)) {
        // Token expired or about to expire
        return null;
      }
      
      return tokenData.accessToken;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  // Save token for a specific CMC
  saveToken: (cmcId, accessToken) => {
    try {
      const tokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      const tokenMap = tokens ? JSON.parse(tokens) : {};
      
      // Token expires in 15 minutes
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      tokenMap[cmcId] = {
        accessToken,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokenMap));
      return true;
    } catch (error) {
      console.error('Failed to save token:', error);
      return false;
    }
  },

  // Clear token for a specific CMC
  clearToken: (cmcId) => {
    try {
      const tokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      if (!tokens) return true;
      
      const tokenMap = JSON.parse(tokens);
      delete tokenMap[cmcId];
      
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokenMap));
      return true;
    } catch (error) {
      console.error('Failed to clear token:', error);
      return false;
    }
  },

  // Clear all stored data
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CMCS);
      localStorage.removeItem(STORAGE_KEYS.TOKENS);
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }
};