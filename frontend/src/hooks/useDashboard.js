// src/hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function getToken() {
  return localStorage.getItem('gramsync_token');
}

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

export function useDashboard() {
  const [summary,      setSummary]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch summary KPIs + recent transactions in parallel
      const [summaryRes, txRes] = await Promise.all([
        apiFetch('/reports/summary?period=today'),
        apiFetch('/transactions/recent?limit=5'),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Derived values with safe fallbacks
  const totalCredit  = summary?.totalCredit  ?? 0;
  const udharCount   = summary?.udharCount   ?? 0;
  const jamaCount    = summary?.jamaCount    ?? 0;
  const recoveryRate = summary?.recoveryRate ?? 0;

  // Format total credit for display
  const totalCreditFormatted = totalCredit.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    totalCredit: totalCreditFormatted,
    udharCount,
    jamaCount,
    recoveryRate,
    transactions,
    loading,
    error,
    refresh: fetch,
  };
}
