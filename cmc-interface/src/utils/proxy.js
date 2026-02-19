// Proxy URL utilities for multi-CMC support

/**
 * Check if we should use Apache proxy URLs
 * In production builds, ALWAYS use proxy pattern to avoid CORS and SSL issues
 */
export const shouldUseApacheProxy = () => {
  // Always use proxy in production builds (not dev server)
  if (!import.meta.env.DEV) {
    console.log('🔧 Using Apache proxy (production build)');
    return true;
  }
  
  // Check if explicitly enabled via env var for dev testing
  const useProxy = import.meta.env.VITE_USE_APACHE_PROXY;
  if (useProxy === 'true' || useProxy === true) {
    console.log('🔧 Using Apache proxy (env var enabled)');
    return true;
  }
  
  console.log('🔧 Using Vite dev proxy (development mode)');
  return false;
};

/**
 * Get API base URL for a CMC
 * Returns proxy URL pattern or direct URL based on environment
 * 
 * Proxy pattern: /api/cmc/{cmc-address}/...
 * Direct pattern: http://{cmc-address}/api/...
 */
export const getApiBaseUrl = (cmcAddress) => {
  if (shouldUseApacheProxy()) {
    // Extract just the host:port from the full URL
    try {
      const url = new URL(cmcAddress);
      const host = url.host; // Includes port if present
      console.log(`🔧 API Base: /api/cmc/${host} (Apache proxy)`);
      return `/api/cmc/${host}`;
    } catch (e) {
      // Fallback if not a valid URL
      const cleaned = cmcAddress.replace(/^https?:\/\//, '');
      console.log(`🔧 API Base: /api/cmc/${cleaned} (Apache proxy - fallback)`);
      return `/api/cmc/${cleaned}`;
    }
  }
  
  // Development with Vite proxy (single CMC) - use relative URLs
  if (import.meta.env.DEV) {
    console.log('🔧 API Base: (empty - Vite proxy)');
    return '';
  }
  
  // Should never reach here, but fallback to direct connection
  console.log('🔧 API Base: direct connection (fallback)');
  return cmcAddress;
};

/**
 * Build complete API endpoint URL
 */
export const buildApiUrl = (cmcAddress, endpoint) => {
  const baseUrl = getApiBaseUrl(cmcAddress);
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const fullUrl = `${baseUrl}${normalizedEndpoint}`;
  console.log(`🔧 Built URL: ${fullUrl}`);
  
  return fullUrl;
};

/**
 * Get iframe URL (always direct, proxy doesn't work for iframes)
 */
export const getIframeUrl = (cmcAddress) => {
  return cmcAddress;
};

/**
 * Log current proxy mode (for debugging)
 */
export const logProxyMode = () => {
  const mode = shouldUseApacheProxy() ? 'Apache Proxy' : 
                import.meta.env.DEV ? 'Vite Proxy' : 'Direct';
  console.log(`🔧 API Mode: ${mode}`);
  console.log(`📍 Environment: ${import.meta.env.MODE}`);
  console.log(`🏗️  Dev Build: ${import.meta.env.DEV}`);
  console.log(`🌐 Use Apache Proxy: ${import.meta.env.VITE_USE_APACHE_PROXY}`);
};