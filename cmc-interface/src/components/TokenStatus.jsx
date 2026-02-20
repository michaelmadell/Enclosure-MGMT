import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, Clock, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { getTokenTimeRemaining, refreshToken } from '../utils/cmcDeviceApi';

export const TokenStatus = ({ cmc }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const autoRefreshAttempted = useRef(false);

  useEffect(() => {
    const updateTime = () => {
      const remaining = getTokenTimeRemaining(cmc.id);
      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    // Listen for token updates
    const handleTokenUpdate = (event) => {
      if (event.detail.cmcId === cmc.id) {
        updateTime();
        // Reset auto-refresh flag when token is updated
        autoRefreshAttempted.current = false;
      }
    };

    window.addEventListener('cmc-token-updated', handleTokenUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cmc-token-updated', handleTokenUpdate);
    };
  }, [cmc.id]);

  const handleRefresh = async () => {
    if (refreshing) return; // Prevent concurrent refreshes
    
    setRefreshing(true);
    const result = await refreshToken(cmc);
    setRefreshing(false);
    
    if (!result.success) {
      alert(`Failed to refresh token: ${result.error}`);
    }
  };

  // Auto-refresh effect - separate from the timer effect
  useEffect(() => {
    if (!timeRemaining) return;

    const { milliseconds } = timeRemaining;
    const isExpiringSoon = milliseconds < 2 * 60 * 1000; // Less than 2 minutes
    const isExpired = milliseconds <= 0;

    // Auto-refresh when token is expiring soon (only once per token lifecycle)
    if (isExpiringSoon && !refreshing && !isExpired && !autoRefreshAttempted.current) {
      console.log('⏰ Token expiring soon, auto-refreshing...');
      autoRefreshAttempted.current = true;
      handleRefresh();
    }
  }, [timeRemaining?.milliseconds]); // Only depend on milliseconds

  // No token yet
  if (!timeRemaining) {
    return (
      <div className="flex items-center gap-2 text-base-content/50 text-sm">
        <Shield className="w-4 h-4" />
        <span className="hidden sm:inline">No Token</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-ghost btn-xs"
          title="Get Token"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  const { minutes, seconds, milliseconds } = timeRemaining;
  const isExpiringSoon = milliseconds < 2 * 60 * 1000; // Less than 2 minutes
  const isExpired = milliseconds <= 0;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-error text-sm">
        <XCircle className="w-4 h-4" />
        <span className="font-medium hidden sm:inline">Token Expired</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-ghost btn-xs"
          title="Refresh Token"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${
      isExpiringSoon ? 'text-warning' : 'text-success'
    }`}>
      {isExpiringSoon ? (
        <AlertCircle className="w-4 h-4 animate-pulse" />
      ) : (
        <CheckCircle className="w-4 h-4" />
      )}
      <Clock className="w-4 h-4" />
      <span className="font-mono font-medium">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="btn btn-ghost btn-xs"
        title="Refresh Token"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};