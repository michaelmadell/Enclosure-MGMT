import React, { useState, useEffect } from 'react';
import { Power, RefreshCw, Zap, Lightbulb, Fan, Terminal, Radio } from 'lucide-react';
import { performPowerAction, startBlink, setFanSpeed, toggleSsh, toggleSerial, fetchCoreState } from '../utils/cmcDeviceApi';

export const ApiToolsPanel = ({ cmc, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [sshEnabled, setSshEnabled] = useState(null);
  const [serialEnabled, setSerialEnabled] = useState(null);
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
    
    if (cmc) {
      loadState();
    }
  }, [cmc?.id]);

  const handlePowerAction = async (action) => {
    if (!confirm(`Are you sure you want to ${action.replace('-', ' ')}?`)) {
      return;
    }

    setLoading(true);
    const result = await performPowerAction(cmc, action);
    setLoading(false);
    
    if (result.success) {
      alert(`Power action '${action}' sent successfully`);
      onActionComplete?.(action);
    } else {
      alert(`Failed to perform power action: ${result.error}`);
    }
  };

  const handleBlink = async () => {
    setLoading(true);
    const result = await startBlink(cmc, 'enclosure', null, 60);
    setLoading(false);
    
    if (result.success) {
      alert('LED blink started (60 seconds)');
      onActionComplete?.('blink');
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
      onActionComplete?.('fan-speed');
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
      // Don't call onActionComplete for SSH toggle - modal should stay open
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
      // Don't call onActionComplete for Serial toggle - modal should stay open
    } else {
      alert(`Failed to toggle serial: ${result.error}`);
    }
  };

  if (!cmc) return null;

  return (
    <div className="space-y-6">
      {fetchingState && (
        <div className="text-center py-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm text-base-content/60 mt-2">Loading CMC state...</p>
        </div>
      )}

      {!fetchingState && (
        <>
          {/* Power Actions */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Power className="w-5 h-5" />
                Power Control
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePowerAction('power-on')}
                  className="btn btn-sm btn-success gap-2"
                  disabled={loading}
                >
                  <Power className="w-4 h-4" />
                  Power On
                </button>
                <button
                  onClick={() => handlePowerAction('power-off')}
                  className="btn btn-sm btn-error gap-2"
                  disabled={loading}
                >
                  <Power className="w-4 h-4" />
                  Power Off
                </button>
                <button
                  onClick={() => handlePowerAction('power-cycle')}
                  className="btn btn-sm btn-warning gap-2"
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4" />
                  Power Cycle
                </button>
              </div>
            </div>
          </div>

          {/* LED Blink */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                LED Control
              </h4>
              <button
                onClick={handleBlink}
                className="btn btn-sm btn-outline gap-2"
                disabled={loading}
              >
                <Lightbulb className="w-4 h-4" />
                Start Blink (60s)
              </button>
            </div>
          </div>

          {/* Fan Control */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Fan className="w-5 h-5" />
                Fan Control
              </h4>
              <button
                onClick={handleFanSpeed}
                className="btn btn-sm btn-outline gap-2"
                disabled={loading}
              >
                <Fan className="w-4 h-4" />
                Set Fan Speed
              </button>
            </div>
          </div>

          {/* SSH/Serial */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Access Control
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleToggleSsh}
                  className={`btn btn-sm gap-2 ${sshEnabled ? 'btn-success' : 'btn-outline'}`}
                  disabled={loading || sshEnabled === null}
                >
                  <Terminal className="w-4 h-4" />
                  SSH {sshEnabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={handleToggleSerial}
                  className={`btn btn-sm gap-2 ${serialEnabled ? 'btn-success' : 'btn-outline'}`}
                  disabled={loading || serialEnabled === null}
                >
                  <Radio className="w-4 h-4" />
                  Serial {serialEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <p className="text-xs text-base-content/60 mt-2">
                Toggle access methods - modal stays open for multiple changes
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};