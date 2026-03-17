// src/api/transactionService.js
// ─── Base config ──────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function getToken() {
  return localStorage.getItem('gramsync_token');
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    // Attach status so callers can handle 401 / 404 specifically
    const err = new Error(data.message || data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ─── Transaction Service ──────────────────────────────────────────────────────

const transactionService = {

  /**
   * List all transactions for a customer
   * GET /customers/:customerId/transactions
   * Optional query: ?type=UDHAR|JAMA&page=1&limit=20
   */
  async list(customerId, { type, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (type) params.set('type', type);
    return request(`/customers/${customerId}/transactions?${params}`);
  },

  /**
   * Get a single transaction
   * GET /transactions/:id
   */
  async get(transactionId) {
    return request(`/transactions/${transactionId}`);
  },

  /**
   * Add Udhar (give credit / debit entry)
   * POST /customers/:customerId/transactions
   * body: { type: 'UDHAR', amount, note? }
   */
  async addUdhar(customerId, { amount, note = '' }) {
    return request(`/customers/${customerId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ type: 'UDHAR', amount, note }),
    });
  },

  /**
   * Add Jama (collect payment / credit entry)
   * POST /customers/:customerId/transactions
   * body: { type: 'JAMA', amount, note? }
   */
  async addJama(customerId, { amount, note = '' }) {
    return request(`/customers/${customerId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ type: 'JAMA', amount, note }),
    });
  },

  /**
   * Mark a transaction as paid
   * PATCH /transactions/:id/mark-paid
   */
  async markPaid(transactionId) {
    return request(`/transactions/${transactionId}/mark-paid`, {
      method: 'PATCH',
    });
  },

  /**
   * Soft-delete / reverse a transaction
   * DELETE /transactions/:id
   */
  async remove(transactionId) {
    return request(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Offline sync — batch upload transactions created while offline
   * POST /transactions/sync
   * body: { transactions: [{ clientId, customerId, type, amount, note, createdAt }] }
   */
  async syncOffline(transactions) {
    return request(`/transactions/sync`, {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  },
};

export default transactionService;
