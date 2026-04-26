// src/hooks/useUserKeymap.js
import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../components/auth/hooks/AuthContextDef';
import apiService from '../services/apiService';
import { getToken } from '../services/tokenUtils';
import { apiEndpoints } from '../services/endpoint/keyboard/keyboardShortcutEnd';

const LOCAL_STORAGE_KEY = 'user_keymap';
let controller = null;

export const useUserKeymap = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [keymap, setKeymap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userKey = user?.userId ? `${LOCAL_STORAGE_KEY}_${user.userId}` : null;

  // Safely load from cache — no API involved
  const loadFromCache = useCallback(() => {
    if (!userKey) return;
    const cached = localStorage.getItem(userKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setKeymap({ ...parsed }); // Force new reference to trigger effects
      } catch (e) {
        console.warn('Corrupted keymap cache');
      }
    }
  }, [userKey]);

  // Common headers used in all requests
  const getAuthHeaders = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Fixes ngrok warning page → fake CORS errors
    };
  }, []);

  // Only fetch if: logged in + has userId + has valid token
  const fetchKeymap = useCallback(async () => {
    if (!isAuthenticated || !user?.userId) {
      setKeymap({});
      setLoading(false);
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      setLoading(false);
      return; // No token → avoid calling API
    }
    if (controller) controller.abort();
    controller = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiService.get(apiEndpoints.GetKeymap(), {
        headers,
        signal: controller.signal,
        timeout: 15000,
      });
      const newKeymap = data.keymap || {};
      localStorage.setItem(userKey, JSON.stringify(newKeymap));
      setKeymap({ ...newKeymap }); // Force new reference to trigger effects
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return; // Ignore canceled requests
      if (err.response?.status === 401) {
        return; // Silently fail — interceptor will handle logout
      }
      console.error('Keymap fetch failed:', err);
      setError('Failed to load shortcuts');
      loadFromCache(); // fallback to cache
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.userId, userKey, getAuthHeaders, loadFromCache]);

  // Initial load / refetch on auth change
  useEffect(() => {
    if (!isAuthenticated || !user?.userId) {
      setKeymap({});
      setError(null);
      setLoading(false);
      return;
    }
    loadFromCache();
    fetchKeymap();
    return () => {
      if (controller) controller.abort();
    };
  }, [isAuthenticated, user?.userId, fetchKeymap, loadFromCache]);

  // Clear cache on logout
  useEffect(() => {
    if (!isAuthenticated && userKey) {
      localStorage.removeItem(userKey);
    }
  }, [isAuthenticated, userKey]);

  // Listen for updates from other hook instances (same tab) or tabs (storage event)
  useEffect(() => {
    const handleUpdate = () => {
      loadFromCache(); // Load updated cache without hitting API
    };
    window.addEventListener('keymapUpdated', handleUpdate);
    const handleStorage = (e) => {
      if (e.key === userKey) handleUpdate();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('keymapUpdated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadFromCache, userKey]);

  // Save updated keymap (computes diff and sends only changed keys)
  const updateKeymap = useCallback(async (newKeymap) => {
    if (!isAuthenticated || !user?.userId) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    if (controller) controller.abort();
    controller = new AbortController();
    const partial = {};
    for (const shortcut in newKeymap) {
      const newConfig = newKeymap[shortcut];
      const oldConfig = keymap[shortcut];
      if (!oldConfig || JSON.stringify(newConfig) !== JSON.stringify(oldConfig)) {
        partial[shortcut] = newConfig;
      }
    }
    if (Object.keys(partial).length === 0) {
      return; // no changes
    }
    try {
      await apiService.put(apiEndpoints.SaveKeymap(), { keymap: partial }, {
        headers,
        signal: controller.signal,
      });
      await fetchKeymap(); // Hit the API to get fresh full keymap
      setError(null);
      window.dispatchEvent(new CustomEvent('keymapUpdated')); // Notify others to load new cache
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return; // Ignore canceled requests
      if (err.response?.status === 401) return;
      setError('Save failed');
    }
  }, [isAuthenticated, user?.userId, getAuthHeaders, keymap, fetchKeymap]);

  // Update a single key (sends only the updated key in the payload)
  const updateSingleKey = useCallback(async (shortcut, config) => {
    if (!isAuthenticated || !user?.userId) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    if (controller) controller.abort();
    controller = new AbortController();
    const partial = { [shortcut]: config };
    try {
      await apiService.put(apiEndpoints.SaveKeymap(), { keymap: partial }, {
        headers,
        signal: controller.signal,
      });
      await fetchKeymap(); // Hit the API to get fresh full keymap
      setError(null);
      window.dispatchEvent(new CustomEvent('keymapUpdated')); // Notify others to load new cache
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return; // Ignore canceled requests
      if (err.response?.status === 401) return;
      setError('Save failed');
    }
  }, [isAuthenticated, user?.userId, getAuthHeaders, fetchKeymap]);

  // Reset all to defaults
  const resetKeymap = useCallback(async () => {
    if (!isAuthenticated || !user?.userId) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    setLoading(true);
    try {
      await apiService.post(apiEndpoints.ResetKeymap(), {}, { headers });
      await fetchKeymap(); // Hit the API to get fresh full keymap after reset
      setError(null);
      window.dispatchEvent(new CustomEvent('keymapUpdated')); // Notify others to load new cache
    } catch (err) {
      if (err.response?.status === 401) return;
      setError('Reset failed');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.userId, getAuthHeaders, fetchKeymap]);

  // Reset specific keys
  const resetKeys = useCallback(async (keys) => {
    if (!isAuthenticated || !keys.length) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    setLoading(true);
    try {
      await apiService.put(apiEndpoints.ResetKeys(), { keys }, { headers });
      await fetchKeymap(); // refresh from server
      window.dispatchEvent(new CustomEvent('keymapUpdated')); // Notify others to load new cache
    } catch (err) {
      if (err.response?.status === 401) return;
      setError('Reset failed');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchKeymap, getAuthHeaders]);

  return {
    keymap,
    updateKeymap,
    updateSingleKey,
    resetKeymap,
    resetKeys,
    refetch: fetchKeymap,
    loading,
    error,
  };
};