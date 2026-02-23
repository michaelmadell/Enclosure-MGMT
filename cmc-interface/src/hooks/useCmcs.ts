import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ActionResult, Cmc, CmcPayload } from '../types';

const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:3001';

export function useCmcs() {
  const [cmcs, setCmcs] = useState<Cmc[]>([]);
  const [selectedCmc, setSelectedCmc] = useState<Cmc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token, logout } = useAuth();

  const fetchWithAuth = useCallback(async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    try {
      console.log('📡 API Request:', url);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json() as T;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }, [logout, token]);

  const fetchCmcs = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use API_BASE_URL + /api/cmcs
      const data = await fetchWithAuth<Cmc[]>(`${API_BASE_URL}/api/cmcs`);
      setCmcs(data);
      setSelectedCmc(prev => prev || data[0] || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CMCs');
      setCmcs([]);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, token]);

  useEffect(() => {
    void fetchCmcs();
  }, [fetchCmcs]);

  const addCmc = async (cmcData: CmcPayload): Promise<ActionResult> => {
    try {
      const data = await fetchWithAuth<Cmc>(`${API_BASE_URL}/api/cmcs`, {
        method: 'POST',
        body: JSON.stringify(cmcData),
      });

      setCmcs(prev => [...prev, data]);
      setSelectedCmc(data);
      
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add CMC' };
    }
  };

  const updateCmc = async (id: string, cmcData: CmcPayload): Promise<ActionResult> => {
    try {
      const data = await fetchWithAuth<Cmc>(`${API_BASE_URL}/api/cmcs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cmcData),
      });

      setCmcs(prev => prev.map(cmc => cmc.id === id ? data : cmc));
      
      if (selectedCmc?.id === id) {
        setSelectedCmc(data);
      }
      
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update CMC' };
    }
  };

  const deleteCmc = async (id: string): Promise<ActionResult> => {
    try {
      await fetchWithAuth<unknown>(`${API_BASE_URL}/api/cmcs/${id}`, {
        method: 'DELETE',
      });

      setCmcs(prev => prev.filter(cmc => cmc.id !== id));
      
      if (selectedCmc?.id === id) {
        setSelectedCmc(cmcs[0] || null);
      }
      
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete CMC' };
    }
  };

  return {
    cmcs,
    selectedCmc,
    setSelectedCmc,
    addCmc,
    updateCmc,
    deleteCmc,
    loading: loading,
    setLoading,
    error,
    refetch: fetchCmcs,
  };
}