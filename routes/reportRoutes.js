const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, isAdmin } = require("../middleware/auth");

// -------------------- DASHBOARD SUMMARY --------------------
router.get("/summary", verifyToken, isAdmin, (req, res) => {
    const queries = {
        totalRevenue: "SELECT SUM(total_amount) as total FROM orders WHERE status != 'Cancelled'",
        totalOrders: "SELECT COUNT(*) as total FROM orders",
        totalProducts: "SELECT COUNT(*) as total FROM products",
        totalUsers: "SELECT COUNT(*) as total FROM users WHERE role = 'user'",
        pendingOrders: "SELECT COUNT(*) as total FROM orders WHERE status = 'Pending'",
    };

    const results = {};
    const queryKeys = Object.keys(queries);
    let completed = 0;

    queryKeys.forEach((key) => {
        db.query(queries[key], (err, rows) => {
            if (err) {
                console.error(`Error in ${key} query:`, err);
                return res.status(500).json({ error: err.message });
            }
            results[key] = rows[0].total || 0;
            completed++;

            if (completed === queryKeys.length) {
                res.json(results);
            }
        });
    });
});

// -------------------- MONTHLY SALES (For Graph) --------------------
router.get("/sales/monthly", verifyToken, isAdmin, (req, res) => {
    const query = `
    SELECT 
      DATE_FORMAT(created_at, '%b %Y') as month,
      SUM(total_amount) as amount
    FROM orders 
    WHERE status != 'Cancelled'
    GROUP BY DATE_FORMAT(created_at, '%Y-%m'), month
    ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
    LIMIT 12
  `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// -------------------- TOP PRODUCTS --------------------
router.get("/products/top", verifyToken, isAdmin, (req, res) => {
    const query = `
    SELECT 
      p.name,
      SUM(oi.quantity) as total_sold,
      SUM(oi.quantity * oi.price) as revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'Cancelled'
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 5
  `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// -------------------- RECENT TRANSACTIONS --------------------
router.get("/transactions/recent", verifyToken, isAdmin, (req, res) => {
    const query = `
    SELECT 
      o.id as order_id,
      u.username,
      o.total_amount,
      o.status,
      o.created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// -------------------- PAYMENT METHODS (For Pie Chart) --------------------
router.get("/payments/methods", verifyToken, isAdmin, (req, res) => {
    const query = `
    SELECT 
      payment_method as method,
      COUNT(*) as count,
      SUM(total_amount) as total
    FROM orders 
    WHERE status != 'Cancelled'
    GROUP BY payment_method
  `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// -------------------- DAILY SALES (Last 7 Days) --------------------
router.get("/sales/daily", verifyToken, isAdmin, (req, res) => {
    const query = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') as date,
      SUM(total_amount) as amount
    FROM orders 
    WHERE status != 'Cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY date
    ORDER BY date ASC
  `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

module.exports = router;
