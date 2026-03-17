// src/hooks/useCustomers.js
import { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function getToken() {
  return localStorage.getItem('gramsync_token');
}

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch(`${BASE_URL}/customers`, {
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to load customers');
      setCustomers(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { customers, loading, error, refresh: fetch };
}
