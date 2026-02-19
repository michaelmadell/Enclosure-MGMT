import React, { useState, useRef } from 'react';
import { Terminal, Activity, ExternalLink, RefreshCw, AlertCircle, Package, X, Lock, Unlock } from 'lucide-react';
import { ApiToolsPanel } from './ApiToolsPanel.tsx';
import { EventsPanel } from './EventsPanel';
import { FirmwarePanel } from './FirmwarePanel';
import { TokenStatus } from './TokenStatus';
import { fetchEvents, fetchFirmwareHistory } from '../utils/api';

export const CmcViewer = ({ cmc }) => {
  const [activePanel, setActivePanel] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [firmwareData, setFirmwareData] = useState([]);
  const [loadingFirmware, setLoadingFirmware] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [autoLogin, setAutoLogin] = useState(() => {
    return localStorage.getItem('cmc-auto-login') === 'true';
  });
  const iframeRef = useRef(null);

  const handleFetchEvents = async () => {
    if (activePanel === 'events') {
      setActivePanel(null);
      return;
    }

    setLoadingEvents(true);
    const result = await fetchEvents(cmc, 50);
    setLoadingEvents(false);
    
    if (result.success) {
      setEvents(result.data);
      setActivePanel('events');
    } else {
      alert(`Failed to fetch events: ${result.error}`);
      setEvents([]);
    }
  };

  const handleFetchFirmware = async () => {
    if (activePanel === 'firmware') {
      setActivePanel(null);
      return;
    }

    setLoadingFirmware(true);
    const result = await fetchFirmwareHistory(cmc);
    setLoadingFirmware(false);
    
    if (result.success) {
      setFirmwareData(result.data);
      setActivePanel('firmware');
    } else {
      alert(`Failed to fetch firmware history: ${result.error}`);
      setFirmwareData([]);
    }
  };

  const toggleApiTools = () => {
    setActivePanel(activePanel === 'api' ? null : 'api');
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  const toggleAutoLogin = () => {
    const newValue = !autoLogin;
    setAutoLogin(newValue);
    localStorage.setItem('cmc-auto-login', newValue.toString());
    // Refresh iframe to apply change
    setIframeKey(prev => prev + 1);
  };

  // Build iframe URL - use auto-login proxy if enabled
  const getIframeUrl = () => {
    if (autoLogin) {
      // URL encode the credentials to handle special characters
      const params = new URLSearchParams({
        address: cmc.address,
        username: cmc.username,
        password: cmc.password
      });
      return `/auto-login.html?${params.toString()}`;
    }
    return cmc.address;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-base-200 border-b border-base-300 px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-base-content truncate">{cmc.name}</h2>
            <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
              <p className="text-xs text-base-content/50 truncate">{cmc.address}</p>
              <TokenStatus cmc={cmc} />
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={toggleApiTools}
              className={`btn btn-sm gap-1 sm:gap-2 ${activePanel === 'api' ? 'btn-primary' : 'btn-ghost'}`}
              title="Toggle API Tools"
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </button>
            <button
              onClick={handleFetchEvents}
              disabled={loadingEvents}
              className={`btn btn-sm gap-1 sm:gap-2 ${activePanel === 'events' ? 'btn-primary' : 'btn-ghost'}`}
              title="Fetch Recent Events"
            >
              <Activity className={`w-4 h-4 ${loadingEvents ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Events</span>
            </button>
            <button
              onClick={handleFetchFirmware}
              disabled={loadingFirmware}
              className={`btn btn-sm gap-1 sm:gap-2 ${activePanel === 'firmware' ? 'btn-primary' : 'btn-ghost'}`}
              title="Fetch Firmware History"
            >
              <Package className={`w-4 h-4 ${loadingFirmware ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Firmware</span>
            </button>
            <button
              onClick={toggleAutoLogin}
              className={`btn btn-sm gap-1 sm:gap-2 ${autoLogin ? 'btn-success' : 'btn-ghost'}`}
              title={autoLogin ? 'Auto-Login Enabled' : 'Auto-Login Disabled'}
            >
              {autoLogin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="hidden lg:inline">{autoLogin ? 'Auto' : 'Manual'}</span>
            </button>
            <button
              onClick={handleRefreshIframe}
              className="btn btn-ghost btn-sm gap-1 sm:gap-2"
              title="Refresh iframe"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden lg:inline">Refresh</span>
            </button>
            <a
              href={cmc.address}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm gap-1 sm:gap-2"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden lg:inline">Open</span>
            </a>
          </div>
        </div>
      </div>

      {/* Active Panel */}
      {activePanel && (
        <div className="bg-base-200 border-b border-base-300 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-base-300">
            <h3 className="text-sm font-semibold text-base-content">
              {activePanel === 'api' && '⚡ API Tools'}
              {activePanel === 'events' && '📋 Recent Events'}
              {activePanel === 'firmware' && '📦 Firmware History'}
            </h3>
            <button
              onClick={closePanel}
              className="btn btn-ghost btn-xs gap-1"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {activePanel === 'api' && <ApiToolsPanel cmc={cmc} />}
            {activePanel === 'events' && <EventsPanel events={events} />}
            {activePanel === 'firmware' && <FirmwarePanel firmwareData={firmwareData} />}
          </div>
        </div>
      )}

      {/* Notice Banner */}
      {!activePanel && (
        <div role="alert" className={`alert rounded-none border-x-0 py-2 text-xs sm:text-sm flex-shrink-0 ${autoLogin ? 'alert-info' : 'alert-warning'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="min-w-0">
            {autoLogin ? (
              <>
                <span className="font-medium">Auto-Login Enabled:</span>{' '}
                <span className="hidden sm:inline">
                  Using proxy page to automatically fill credentials and attempt login.
                </span>
                <span className="sm:hidden">Auto-login via proxy enabled.</span>
              </>
            ) : (
              <>
                <span className="font-medium">Manual Login Required:</span>{' '}
                <span className="hidden sm:inline">
                  Enable Auto-Login to automatically fill credentials, or use <span className="font-medium">"Open"</span> for direct access.
                </span>
                <span className="sm:hidden">Enable Auto-Login or use "Open".</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* iframe Container */}
      <div className="flex-1 bg-base-300 p-2 sm:p-4 overflow-hidden min-h-0">
        <div className="h-full bg-white rounded-lg overflow-hidden shadow-xl">
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={getIframeUrl()}
            className="w-full h-full border-0"
            title={`${cmc.name} CMC Interface`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </div>
  );
};