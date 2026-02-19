import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Loader, Plus } from 'lucide-react';
import { buildApiUrl } from '../utils/proxy';

export const AddCmcModal = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    username: '',
    password: '',
    notes: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [testStatus, setTestStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (!formData.address.match(/^https?:\/\//)) {
      newErrors.address = 'Address must start with http:// or https://';
    }
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testConnection = async () => {
    if (!validate()) return;
    setTestStatus('testing');
    setTestMessage('Testing authentication...');
    try {
      const url = buildApiUrl(formData.address, '/api/auth/token');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });
      if (!response.ok) throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (!data.accessToken) throw new Error('No access token received');
      setTestStatus('success');
      setTestMessage('Authentication successful! Credentials are valid.');
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`Connection failed: ${error.message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onAdd(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (['address', 'username', 'password'].includes(field)) {
      setTestStatus(null);
      setTestMessage('');
    }
  };

  // Only close when clicking the backdrop itself, not the card
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    // ✅ div NOT button — <button> causes Space key to close the modal from any child input
    <div
      className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="card bg-base-100 shadow-2xl max-w-md w-full border border-base-300 my-4">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-base-300">
          <h2 className="text-lg sm:text-xl font-bold text-base-content">Add New CMC</h2>
          <p className="text-xs sm:text-sm text-base-content/50 mt-1">Configure a new chassis management controller</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Production Chassis 1"
              className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              CMC Address <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="https://192.168.1.100"
              className={`input input-bordered w-full ${errors.address ? 'input-error' : ''}`}
            />
            {errors.address
              ? <p className="text-xs text-error mt-1">{errors.address}</p>
              : <p className="text-xs text-base-content/40 mt-1">Include protocol (http:// or https://)</p>
            }
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Username <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="admin"
              autoComplete="off"
              className={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`}
            />
            {errors.username && <p className="text-xs text-error mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Password <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
          </div>

          {/* Test Connection */}
          <div>
            <button
              type="button"
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              className="btn btn-accent w-full gap-2"
            >
              {testStatus === 'testing'
                ? <><Loader className="w-4 h-4 animate-spin" />Testing Connection...</>
                : <><CheckCircle className="w-4 h-4" />Test Connection</>
              }
            </button>

            {testMessage && (
              <div role="alert" className={`alert mt-3 text-sm ${
                testStatus === 'success' ? 'alert-success' :
                testStatus === 'error' ? 'alert-error' : 'alert-info'
              }`}>
                {testStatus === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                {testStatus === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Notes <span className="text-base-content/40">(Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Location, contact info, etc."
              rows={3}
              className="textarea textarea-bordered w-full resize-none"
            />
          </div>
        </form>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-base-300 flex gap-2 sm:gap-3 justify-end flex-wrap sm:flex-nowrap">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm flex-1 sm:flex-initial">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm gap-2 flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" />
            Add CMC
          </button>
        </div>
      </div>
    </div>
  );
};