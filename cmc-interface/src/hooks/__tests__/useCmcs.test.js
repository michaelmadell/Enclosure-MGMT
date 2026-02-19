import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCmcs } from '../useCmcs';

describe('useCmcs Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('should fetch CMCs on mount', async () => {
    const mockCmcs = [
      { id: '1', name: 'CMC 1', address: 'https://10.0.0.1' },
      { id: '2', name: 'CMC 2', address: 'https://10.0.0.2' },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCmcs,
    });

    const { result } = renderHook(() => useCmcs());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cmcs).toEqual(mockCmcs);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCmcs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.cmcs).toEqual([]);
  });

  it('should add a new CMC', async () => {
    const newCmc = {
      name: 'New CMC',
      address: 'https://10.0.0.3',
      username: 'admin',
      password: 'pass',
    };

    const createdCmc = { id: '3', ...newCmc };

    // Mock initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useCmcs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock add CMC
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createdCmc,
    });

    await result.current.addCmc(newCmc);

    await waitFor(() => {
      expect(result.current.cmcs).toHaveLength(1);
      expect(result.current.cmcs[0]).toEqual(createdCmc);
    });
  });

  it('should update a CMC', async () => {
    const existingCmc = { id: '1', name: 'CMC 1', address: 'https://10.0.0.1' };
    const updatedData = { name: 'Updated CMC', address: 'https://10.0.0.2' };

    // Mock initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [existingCmc],
    });

    const { result } = renderHook(() => useCmcs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock update
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...existingCmc, ...updatedData }),
    });

    await result.current.updateCmc('1', updatedData);

    await waitFor(() => {
      expect(result.current.cmcs[0].name).toBe('Updated CMC');
    });
  });

  it('should delete a CMC', async () => {
    const existingCmcs = [
      { id: '1', name: 'CMC 1', address: 'https://10.0.0.1' },
      { id: '2', name: 'CMC 2', address: 'https://10.0.0.2' },
    ];

    // Mock initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => existingCmcs,
    });

    const { result } = renderHook(() => useCmcs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock delete
    fetch.mockResolvedValueOnce({ ok: true });

    await result.current.deleteCmc('1');

    await waitFor(() => {
      expect(result.current.cmcs).toHaveLength(1);
      expect(result.current.cmcs[0].id).toBe('2');
    });
  });
});