import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = 'https://localhost:3001/api';

export function useCmcs() {
  const [cmcs, setCmcs] = useState([]);
  const [selectedCmc, setSelectedCmc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, logout } = useAuth();

  // Helper to make authenticated requests
  const fetchWithAuth = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      // Handle unauthorized
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  // Fetch all CMCs
  const fetchCmcs = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchWithAuth(`${API_BASE_URL}/cmcs`);
      setCmcs(data);
      
      // Select first CMC if none selected
      if (data.length > 0 && !selectedCmc) {
        setSelectedCmc(data[0]);
      }
    } catch (err) {
      setError(err.message);
      setCmcs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCmcs();
  }, [token]);

  // Add CMC
  const addCmc = async (cmcData) => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/cmcs`, {
        method: 'POST',
        body: JSON.stringify(cmcData),
      });

      setCmcs(prev => [...prev, data]);
      setSelectedCmc(data);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update CMC
  const updateCmc = async (id, cmcData) => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/cmcs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cmcData),
      });

      setCmcs(prev => prev.map(cmc => cmc.id === id ? data : cmc));
      
      if (selectedCmc?.id === id) {
        setSelectedCmc(data);
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Delete CMC
  const deleteCmc = async (id) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/cmcs/${id}`, {
        method: 'DELETE',
      });

      setCmcs(prev => prev.filter(cmc => cmc.id !== id));
      
      if (selectedCmc?.id === id) {
        setSelectedCmc(cmcs[0] || null);
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    cmcs,
    selectedCmc,
    setSelectedCmc,
    addCmc,
    updateCmc,
    deleteCmc,
    loading,
    error,
    refetch: fetchCmcs,
  };
}