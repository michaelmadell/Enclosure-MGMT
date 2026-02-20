import React, { useState, useEffect } from 'react';
import { Power, RefreshCw, Zap, Lightbulb, Fan, Terminal, Radio } from 'lucide-react';
import { performPowerAction, startBlink, setFanSpeed, toggleSsh, toggleSerial, fetchCoreState } from '../utils/api';
import { PowerConfirm } from './PowerConfirmDialog';

interface ApiToolsPanelProps {
  cmc: any;
}

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
  }, [cmc.id]);

interface ActionProps {
    action: string;
}

  const handlePowerAction = async ({ action }: ActionProps): Promise<void> => {
    setLoading(true);
    const confirmation = await PowerConfirm({ 
        message: `Are you sure you want to ${action.replace('-', ' ')}?`
    });
    if (confirmation) {
    const result = await performPowerAction(cmc, action);
    setLoading(false);
    if (result.success) {
      alert(`Power action '${action}' sent successfully`);
    } else {
      alert(`Failed to perform power action: ${result.error}`);
    }
} else {
    setLoading(false);
}
  };

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

  const handleFanSpeed = async () => {
    const speed = prompt('Enter fan speed (0-100):');
    if (speed === null) return;
    const speedNum = parseInt(speed);
    if (isNaN(speedNum) || speedNum < 0 || speedNum > 100) {
      alert('Invalid fan speed. Must be 0-100.');
      return;
    }
    setLoading(true);
    const result = await setFanSpeed(cmc, speedNum);
    setLoading(false);
    if (result.success) {
      alert(`Fan speed set to ${speedNum}%`);
    } else {
      alert(`Failed to set fan speed: ${result.error}`);
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