import { useState, useEffect } from 'react';
import { Lightbulb, Terminal, Radio } from 'lucide-react';
import { startBlink, toggleSsh, toggleSerial, fetchCoreState } from '../utils/cmcDeviceApi';
import type { ApiToolsPanelProps } from '@/types';

export const ApiToolsPanel = ({ cmc }: ApiToolsPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [sshEnabled, setSshEnabled] = useState<boolean | null>(null);
  const [serialEnabled, setSerialEnabled] = useState<boolean | null>(null);
  const [fetchingState, setFetchingState] = useState(true);

  // Fetch initial state on mount
  useEffect(() => {
    const loadState = async () => {
      setFetchingState(true);
      const result = await fetchCoreState(cmc);
      setFetchingState(false);
      
      if (result.success && result.data.enclosure?.['1']) {
        setSshEnabled(result.data.enclosure['1'].sshEnabled);
        setSerialEnabled(result.data.enclosure['1'].serialEnabled);
      }
    };
    
    loadState();
  }, [cmc]);

  const handleBlink = async () => {
    setLoading(true);
    const result = await startBlink(cmc, 'enclosure', null, 60);
    setLoading(false);
    if (result.success) {
      alert('LED blink started (60 seconds)');
    } else {
      alert(`Failed to start blink: ${result.error}`);
    }
  };

  const handleToggleSsh = async () => {
    const newState = !sshEnabled;
    setLoading(true);
    const result = await toggleSsh(cmc, newState);
    setLoading(false);
    
    if (result.success) {
      setSshEnabled(newState);
      alert(`SSH ${newState ? 'enabled' : 'disabled'} successfully`);
    } else {
      alert(`Failed to toggle SSH: ${result.error}`);
    }
  };

  const handleToggleSerial = async () => {
    const newState = !serialEnabled;
    setLoading(true);
    const result = await toggleSerial(cmc, newState);
    setLoading(false);
    
    if (result.success) {
      setSerialEnabled(newState);
      alert(`Serial console ${newState ? 'enabled' : 'disabled'} successfully`);
    } else {
      alert(`Failed to toggle serial: ${result.error}`);
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-3">

        {/* System Actions */}
        <div>
          <h4 className="text-xs font-medium text-base-content/40 mb-2">System Control</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBlink}
              disabled={loading}
              className="btn btn-info btn-sm gap-2"
            >
              <Lightbulb className="w-4 h-4" /> Blink LED
            </button>
          </div>
        </div>

        {/* Access Control */}
        <div>
          <h4 className="text-xs font-medium text-base-content/40 mb-2">Access Control</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleToggleSsh}
              disabled={loading || fetchingState || sshEnabled === null}
              className={`btn btn-sm gap-2 ${
                sshEnabled ? 'btn-success' : 'btn-ghost'
              }`}
              title={sshEnabled ? 'SSH is enabled - click to disable' : 'SSH is disabled - click to enable'}
            >
              <Terminal className="w-4 h-4" />
              SSH: {fetchingState ? '...' : sshEnabled ? 'Enabled' : 'Disabled'}
            </button>
            <button
              onClick={handleToggleSerial}
              disabled={loading || fetchingState || serialEnabled === null}
              className={`btn btn-sm gap-2 ${
                serialEnabled ? 'btn-success' : 'btn-ghost'
              }`}
              title={serialEnabled ? 'Serial is enabled - click to disable' : 'Serial is disabled - click to enable'}
            >
              <Radio className="w-4 h-4" />
              Serial: {fetchingState ? '...' : serialEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};