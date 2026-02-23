import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { refreshToken } from '../utils/cmcDeviceApi';

export const TokenStatus = ({ cmc }) => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const updateTokenInfo = () => {
    try {
      const tokens = localStorage.getItem('cmc-device-tokens');
      if (!tokens) {
        setTokenInfo(null);
        return;
      }
      
      const tokenMap = JSON.parse(tokens);
      const tokenData = tokenMap[cmc.id];
      
      if (!tokenData) {
        setTokenInfo(null);
        return;
      }

      const expiresAt = tokenData.expiresAt;
      const now = Date.now();
      const timeLeft = expiresAt - now;
      
      setTokenInfo({
        hasToken: true,
        expiresAt: tokenData.expiresAt,
        createdAt: tokenData.createdAt,
        isExpired: timeLeft <= 0,
        timeLeft: timeLeft
      });
    } catch (error) {
      console.error('Failed to get token info:', error);
      setTokenInfo(null);
    }
  };

  const getTimeUntilExpiry = () => {
    if (!tokenInfo) return null;
    
    if (tokenInfo.isExpired) {
      return 'Expired';
    }
    
    const timeLeft = tokenInfo.timeLeft > 0 ? tokenInfo.timeLeft : 0;
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000); // Update every second
    
    // Listen for token updates from cmcDeviceApi
    const handleTokenUpdate = (e) => {
      if (e.detail?.cmcId === cmc.id) {
        updateTokenInfo();
      }
    };
    window.addEventListener('cmc-token-updated', handleTokenUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('cmc-token-updated', handleTokenUpdate);
    };
  }, [cmc.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await refreshToken(cmc);
    setRefreshing(false);
    
    if (result.success) {
      // Force a small delay to ensure token is persisted before reading
      setTimeout(() => {
        updateTokenInfo();
      }, 100);
    } else {
      alert(`Failed to refresh token: ${result.error}`);
    }
  };

  if (!tokenInfo) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Shield className="w-4 h-4" />
        <span>No active token</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Fetch new auth token"
          className="ml-2 p-1 w-6 h-6 bg-base-100 text-blue-400 rounded hover:text-black hover:bg-blue-400 hover:cursor-pointer disabled:opacity-50"
        >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${
      tokenInfo.isExpired ? 'text-red-400' : 
      tokenInfo.timeLeft < 300000 ? 'text-yellow-400' : // < 5 minutes
      'text-green-400'
    }`}>
      {tokenInfo.isExpired ? (
        <XCircle className="w-4 h-4" />
      ) : (
        <CheckCircle className="w-4 h-4" />
      )}
      <Clock className="w-4 h-4" />
      <span className="font-medium">{getTimeUntilExpiry()}</span>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        title="Refresh Token"
        className="text-current hover:opacity-75 disabled:opacity-50 transition-opacity"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};