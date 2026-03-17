// src/hooks/useTransactions.js
import { useState, useEffect, useCallback } from 'react';
import transactionService from '../api/transactionService';

/**
 * useTransactions(customerId)
 *
 * Returns everything the Transactions screen needs:
 *   transactions  — full list
 *   balance       — derived current balance (sum of UDHAR - JAMA)
 *   loading       — initial fetch in progress
 *   error         — error message string or null
 *   addUdhar      — fn(amount, note?) → Promise
 *   addJama       — fn(amount, note?) → Promise
 *   markPaid      — fn(transactionId) → Promise
 *   remove        — fn(transactionId) → Promise
 *   refresh       — fn() re-fetches the list
 */
export function useTransactions(customerId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetch = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await transactionService.list(customerId);
      setTransactions(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // ── Derived balance ────────────────────────────────────────────────────────
  const balance = transactions.reduce((acc, t) => {
    if (t.deletedAt) return acc;
    return t.type === 'UDHAR' ? acc + t.amount : acc - t.amount;
  }, 0);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const withRefresh = (fn) => async (...args) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await fn(...args);
      await fetch(); // re-fetch after mutation
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const addUdhar = withRefresh((amount, note = '') =>
    transactionService.addUdhar(customerId, { amount, note })
  );

  const addJama = withRefresh((amount, note = '') =>
    transactionService.addJama(customerId, { amount, note })
  );

  const markPaid = withRefresh((transactionId) =>
    transactionService.markPaid(transactionId)
  );

  const remove = withRefresh((transactionId) =>
    transactionService.remove(transactionId)
  );

  return {
    transactions,
    balance,
    loading,
    error,
    submitting,
    addUdhar,
    addJama,
    markPaid,
    remove,
    refresh: fetch,
  };
}