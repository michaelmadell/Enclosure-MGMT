import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useCmcs = () => {
  const [cmcs, setCmcs] = useState([]);
  const [selectedCmc, setSelectedCmc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all CMCs from API
  const fetchCmcs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/cmcs`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CMCs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCmcs(data);
      
      // If a CMC was selected, update it with fresh data
      if (selectedCmc) {
        const updatedSelected = data.find(c => c.id === selectedCmc.id);
        setSelectedCmc(updatedSelected || null);
      }
    } catch (err) {
      console.error('Error fetching CMCs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load CMCs on mount
  useEffect(() => {
    fetchCmcs();
  }, []);

  // Add new CMC
  const addCmc = async (cmcData) => {
    try {
      const response = await fetch(`${API_BASE}/cmcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmcData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create CMC');
      }

      const newCmc = await response.json();
      setCmcs(prev => [...prev, newCmc]);
      return { success: true, cmc: newCmc };
    } catch (err) {
      console.error('Error adding CMC:', err);
      return { success: false, error: err.message };
    }
  };

  // Update existing CMC
  const updateCmc = async (id, cmcData) => {
    try {
      const response = await fetch(`${API_BASE}/cmcs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmcData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update CMC');
      }

      const updated = await response.json();
      setCmcs(prev => prev.map(c => c.id === id ? updated : c));
      
      if (selectedCmc?.id === id) {
        setSelectedCmc(updated);
      }

      return { success: true, cmc: updated };
    } catch (err) {
      console.error('Error updating CMC:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete CMC
  const deleteCmc = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/cmcs/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete CMC');
      }

      setCmcs(prev => prev.filter(c => c.id !== id));
      
      if (selectedCmc?.id === id) {
        setSelectedCmc(null);
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting CMC:', err);
      return { success: false, error: err.message };
    }
  };

  // Refresh CMCs from API
  const refreshCmcs = () => {
    fetchCmcs();
  };

  return {
    cmcs,
    selectedCmc,
    setSelectedCmc,
    addCmc,
    updateCmc,
    deleteCmc,
    refreshCmcs,
    loading,
    error
  };
};