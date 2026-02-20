import React, { useState } from 'react';
import { Terminal, Activity, ExternalLink, RefreshCw, AlertCircle, Settings, X, Info } from 'lucide-react';
import { ApiToolsPanel } from './ApiToolsPanel';
import { TokenStatus } from './TokenStatus';
import { getIframeUrl } from '../utils/proxy';

export function CmcViewer({ cmc }) {
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

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

  const iframeUrl = getIframeUrl(cmc.address);

  const handleOpenCmc = () => {
    window.open(cmc.address, '_blank', 'noopener,noreferrer');
  };

  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
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
              onClick={() => setShowInfoModal(true)}
              className="btn btn-sm btn-ghost gap-1 sm:gap-2"
              title="Connection Info"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Info</span>
            </button>
            <button
              onClick={() => setShowToolsModal(true)}
              className="btn btn-sm btn-ghost gap-1 sm:gap-2"
              title="API Tools"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Tools</span>
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
      <div className="flex-1 bg-base-300 p-2 sm:p-4 overflow-hidden min-h-0">
        <div className="h-full bg-white rounded-lg overflow-hidden shadow-xl">
          <iframe
            key={iframeKey}
            src={iframeUrl}
            className="w-full h-full border-0"
            title={`${cmc.name} CMC Interface`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
          />
        </div>
      </div>

      {/* API Tools Modal */}
      {showToolsModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                API Management Tools
              </h3>
              <button
                onClick={() => setShowToolsModal(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <ApiToolsPanel cmc={cmc} />

            <div className="modal-action">
              <button
                onClick={() => setShowToolsModal(false)}
                className="btn"
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowToolsModal(false)}></div>
        </div>
      )}

      {/* Connection Info Modal */}
      {showInfoModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">{cmc.name}</h3>
              <button
                onClick={() => setShowInfoModal(false)}
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
                  setShowInfoModal(false);
                }}
                className="btn btn-primary gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </button>
              <button
                onClick={() => setShowInfoModal(false)}
                className="btn btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowInfoModal(false)}></div>
        </div>
      )}
    </div>
  );
}