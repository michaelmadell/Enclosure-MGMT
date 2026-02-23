import { useRef, useState } from 'react';
import { Terminal, ExternalLink, RefreshCw, Settings, X, Info, Activity, Package } from 'lucide-react';
import { ApiToolsPanel } from './ApiToolsPanel';
import { TokenStatus } from './TokenStatus';
import type { CmcViewerProps } from '../types';
import type { CmcEvent } from '../types';
import type { FirmwareEntry } from '../types';
import { fetchFirmwareHistory, fetchEvents } from '@/utils/cmcDeviceApi';
import { FirmwarePanel } from './FirmwarePanel';
import { EventsPanel } from './EventsPanel';

export function CmcViewer({ cmc }: CmcViewerProps) {
  const [activePanel, setActivePanel] = useState<null | 'api' | 'firmware' | 'events' | 'info' | 'tools'>(null);
  const [events, setEvents] = useState<CmcEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [firmwareData, setFirmwareData] = useState<FirmwareEntry[]>([]);
  const [loadingFirmware, setLoadingFirmware] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getIframeUrl = (cmcAddress: string) => {
  return cmcAddress;
};

  if (!cmc) {
    return (
      <div className="h-full flex items-center justify-center bg-base-100">
        <div className="text-center text-base-content/60">
          <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select a CMC from the sidebar</p>
        </div>
      </div>
    );
  }

  const renderInfoPanel = () => {
    return (
      <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">{cmc.name}</h3>
              <button
                onClick={closePanel}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Address</label>
                <div className="mt-1 flex items-center gap-2">
                  <a 
                    href={cmc.address} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link link-primary font-mono text-sm"
                  >
                    {cmc.address}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(cmc.address)}
                    className="btn btn-ghost btn-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Username</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-sm bg-base-200 px-2 py-1 rounded">{cmc.username}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(cmc.username)}
                      className="btn btn-ghost btn-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Password</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-sm bg-base-200 px-2 py-1 rounded">{'•'.repeat(8)}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(cmc.password)}
                      className="btn btn-ghost btn-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {cmc.notes && (
                <>
                  <div className="divider my-2"></div>
                  <div>
                    <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Notes</label>
                    <p className="mt-1 text-sm whitespace-pre-wrap bg-base-200 p-3 rounded">{cmc.notes}</p>
                  </div>
                </>
              )}

              <div className="divider my-2"></div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-base-content/60">Created</label>
                  <p className="mt-0.5">{new Date(cmc.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="font-semibold text-base-content/60">Updated</label>
                  <p className="mt-0.5">{new Date(cmc.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  handleOpenCmc();
                  setActivePanel(null);
                }}
                className="btn btn-primary gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </button>
              <button
                onClick={() => setActivePanel(null)}
                className="btn btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setActivePanel(null)}></div>
        </div>
    );
  }

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
  }

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
  }

  const toggleApiTools = () => {
    setActivePanel(prev => prev === 'api' ? null : 'api');
  }

  const toggleInfo = () => {
    setActivePanel(prev => prev === 'info' ? null : 'info');
  }
  
  const closePanel = () => {
    setActivePanel(null);
  }

  const handleOpenCmc = () => {
    window.open(cmc.address, '_blank', 'noopener,noreferrer');
  };

  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-base-200 border-b border-base-300 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-base-content truncate">{cmc.name}</h2>
            <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
              <p className="text-xs text-base-content/50 truncate">{cmc.address}</p>
              <TokenStatus cmc={cmc} />
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={toggleInfo}
              className="btn btn-sm btn-ghost gap-1 sm:gap-2"
              title="Connection Info"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Info</span>
            </button>
            <button
              onClick={toggleApiTools}
              className="btn btn-sm btn-ghost gap-1 sm:gap-2"
              title="API Tools"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Tools</span>
            </button>
            <button
              onClick={handleFetchEvents}
              disabled={loadingEvents}
              className="btn btn-sm btn-ghost gap-1 sm:gap-2"
              title="View Events"
              >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </button>
            <button
              onClick={handleFetchFirmware}
              disabled={loadingFirmware}
              className="btn btn-sm btn-ghost gap-1 sm:gap-2"
              title="Firmware History"
              >
                <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Firmware</span>
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
              className="btn btn-primary btn-sm gap-1 sm:gap-2"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden lg:inline">Open</span>
            </a>
          </div>
        </div>
      </div>

      {/* iframe Container */}
            <div className="flex-1 bg-base-300 p-2 sm:p-4 overflow-hidden min-h-0 relative">
        <div className="h-full bg-white rounded-lg overflow-hidden shadow-xl">
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={getIframeUrl(cmc.address)}
            className="w-full h-full border-0"
            title={`${cmc.name} CMC Interface`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
          />
        </div>

        {(activePanel === 'api' || activePanel === 'events' || activePanel === 'firmware') && (
          <div className="absolute inset-x-2 sm:inset-x-4 top-2 sm:bottom-4 z-20">
            <div className="bg-base-200/95 backdrop-blur border border-base-300 rounded-lg shadow-xl overflow-hidden">
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
          </div>
        )}
      </div>

      {activePanel === 'info' && renderInfoPanel()}
        
    </div>
  );
}