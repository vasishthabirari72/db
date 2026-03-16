const express = require('express');
const { query } = require('../postgres');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── GET /api/ledger/:customerId ────────────────────────────────────────────
// Returns full transaction history for a customer, paginated.
router.get('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const offset = (page - 1) * limit;

    // Verify ownership
    const custCheck = await query(
      'SELECT id, name FROM customers WHERE id = $1 AND merchant_id = $2',
      [customerId, req.merchant.id]
    );
    if (!custCheck.rows.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Transactions — newest first
    const txnResult = await query(`
      SELECT
        id, type, amount, note,
        created_at AS "createdAt",
        sync_status AS "syncStatus"
      FROM transactions
      WHERE customer_id = $1 AND merchant_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `, [customerId, req.merchant.id, limit, offset]);

    // Summary stats
    const statsResult = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN type='udhar' THEN amount ELSE 0 END), 0) AS "totalUdhar",
        COALESCE(SUM(CASE WHEN type='jama'  THEN amount ELSE 0 END), 0) AS "totalJama",
        COUNT(*) AS "txnCount",
        MAX(created_at) AS "lastActivity"
      FROM transactions
      WHERE customer_id = $1 AND merchant_id = $2
    `, [customerId, req.merchant.id]);

    const stats   = statsResult.rows[0];
    const balance = parseInt(stats.totalUdhar) - parseInt(stats.totalJama);

    res.json({
      customer:     custCheck.rows[0],
      transactions: txnResult.rows,
      summary: {
        balance,
        totalUdhar:   parseInt(stats.totalUdhar),
        totalJama:    parseInt(stats.totalJama),
        txnCount:     parseInt(stats.txnCount),
        lastActivity: stats.lastActivity,
      },
      pagination: { page, limit, hasMore: txnResult.rows.length === limit },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/ledger/summary/all ────────────────────────────────────────────
// Dashboard summary: total outstanding, top debtors
router.get('/summary/all', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(DISTINCT customer_id)                                               AS "totalCustomers",
        COALESCE(SUM(CASE WHEN type='udhar' THEN amount ELSE 0 END), 0)          AS "totalUdhar",
        COALESCE(SUM(CASE WHEN type='jama'  THEN amount ELSE 0 END), 0)          AS "totalJama",
        COUNT(*)                                                                  AS "totalTxns"
      FROM transactions
      WHERE merchant_id = $1
    `, [req.merchant.id]);

    const stats   = result.rows[0];
    const balance = parseInt(stats.totalUdhar) - parseInt(stats.totalJama);

    res.json({
      balance,
      totalUdhar:    parseInt(stats.totalUdhar),
      totalJama:     parseInt(stats.totalJama),
      totalCustomers: parseInt(stats.totalCustomers),
      totalTxns:     parseInt(stats.totalTxns),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;