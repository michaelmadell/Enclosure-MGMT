import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export function AddCmcModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    username: '',
    password: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.name || !formData.address || !formData.username || !formData.password) {
      setError('Name, address, username, and password are required');
      return;
    }

    // Validate address format
    try {
      const url = new URL(formData.address);
      if (!['http:', 'https:'].includes(url.protocol)) {
        setError('Address must start with http:// or https://');
        return;
      }
    } catch (err) {
      setError('Invalid address format. Must be a valid URL (e.g., https://10.50.0.94)');
      return;
    }

    setLoading(true);
    const result = await onAdd(formData);
    setLoading(false);

    if (result.success) {
      setFormData({
        name: '',
        address: '',
        username: '',
        password: '',
        notes: '',
      });
      onClose();
    } else {
      setError(result.error || 'Failed to add CMC');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New CMC
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Name *</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="e.g., Lab CMC 1"
                required
                disabled={loading}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Address *</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="https://10.50.0.94"
                required
                disabled={loading}
              />
              <label className="label">
                <span className="label-text-alt">Full URL including http:// or https://</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Username *</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="admin"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Password *</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input input-bordered"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Notes</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="textarea textarea-bordered h-24"
                placeholder="Optional notes about this CMC..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add CMC
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}