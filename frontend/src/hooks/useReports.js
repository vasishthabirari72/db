// src/hooks/useReports.js
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

// Map period tab → API period param
const PERIOD_MAP = { '7D': '7D', '1M': '1M', '3M': '3M' };

export function useReports(period) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiPeriod = PERIOD_MAP[period] || '1M';

      const [summaryRes, cashflowRes, topRes] = await Promise.all([
        apiFetch(`/reports/summary?period=${apiPeriod}`),
        apiFetch(`/reports/cashflow?period=${apiPeriod}`),
        apiFetch(`/reports/top-balances?limit=5`),
      ]);

      const summary  = summaryRes.data  || {};
      const cashflow = cashflowRes.data || {};
      const tops     = topRes.data      || [];

      // Map top balances to UI shape
      const topCustomers = tops.map(c => ({
        name:     c.name,
        initials: c.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase(),
        balance:  c.currentBalance ?? 0,
        status:   c.status || 'new',
        overdue:  c.status === 'high-risk' || c.status === 'caution',
        id:       c.id,
      }));

      // Map cashflow bars → labels + udhar/jama arrays
      const bars      = cashflow.bars      || [];
      const barLabels = bars.map(b => b.label);
      const udharData = bars.map(b => b.udhar ?? 0);
      const jamaData  = bars.map(b => b.jama  ?? 0);
      const trendData = bars.map(b => (b.udhar ?? 0) - (b.jama ?? 0));

      setData({
        kpis: {
          totalCredit:  summary.totalCredit   ?? 0,
          collected:    summary.collected      ?? 0,
          pending:      summary.pending        ?? 0,
          customers:    summary.activeCustomers ?? 0,
          transactions: summary.transactionCount ?? 0,
          recoveryRate: summary.recoveryRate   ?? 0,
        },
        barLabels,
        udharData,
        jamaData,
        trendLabels: barLabels,
        trendData,
        topCustomers,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
