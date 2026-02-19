import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { storage } from '../utils/storage';
import { refreshToken } from '../utils/api';

export const TokenStatus = ({ cmc }) => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(null);

  const updateTokenInfo = () => {
    try {
      const tokens = localStorage.getItem('cmc-central-manager-tokens');
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

      const expiresAt = new Date(tokenData.expiresAt);
      const now = new Date();
      const timeLeft = expiresAt - now;
      
      setTokenInfo({
        hasToken: true,
        expiresAt: tokenData.expiresAt,
        createdAt: tokenData.createdAt,
        isExpired: timeLeft <= 0,
        timeLeft: timeLeft
      });
      
      // Update countdown
      if (timeLeft > 0) {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        setTimeUntilExpiry(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilExpiry('Expired');
      }
    } catch (error) {
      console.error('Failed to get token info:', error);
      setTokenInfo(null);
    }
  };

  useEffect(() => {
    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000); // Update every second
    return () => clearInterval(interval);
  }, [cmc.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await refreshToken(cmc);
    setRefreshing(false);
    
    if (result.success) {
      updateTokenInfo();
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
          className="ml-2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
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
      <span className="font-medium">{timeUntilExpiry}</span>
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