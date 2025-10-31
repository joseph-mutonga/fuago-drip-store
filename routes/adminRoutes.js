const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, isAdmin } = require("../middleware/auth");

// -------------------- GET ALL USERS --------------------
router.get("/users", verifyToken, isAdmin, (req, res) => {
  const query = `
    SELECT u.id, u.username, u.email, u.role, u.created_at,
           COUNT(o.id) AS orderCount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
    ORDER BY u.id DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// -------------------- GET SINGLE USER + ORDERS --------------------
router.get("/user/:id", verifyToken, isAdmin, (req, res) => {
  const userId = req.params.id;

  // First, get user info and order count
  const userQuery = `
    SELECT u.id, u.username, u.email, u.role, u.created_at,
           COUNT(o.id) AS orderCount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `;

  db.query(userQuery, [userId], (err, userResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (userResults.length === 0)
      return res.status(404).json({ error: "User not found" });

    const user = userResults[0];

    // Get detailed orders for the user
    const ordersQuery = `
      SELECT o.id AS order_id, p.name AS product_name, o.quantity, o.payment_method, o.created_at
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    db.query(ordersQuery, [userId], (err2, ordersResults) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        ...user,
        orders: ordersResults
      });
    });
  });
});

// -------------------- DELETE USER --------------------
router.delete("/user/:id", verifyToken, isAdmin, (req, res) => {
  const userId = req.params.id;

  // Optional: delete user orders first if needed
  const deleteOrdersQuery = `DELETE FROM orders WHERE user_id = ?`;
  db.query(deleteOrdersQuery, [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    const deleteUserQuery = `DELETE FROM users WHERE id = ?`;
    db.query(deleteUserQuery, [userId], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: "User deleted successfully" });
    });
  });
});

// -------------------- UPDATE USER ROLE --------------------
router.put("/user/:id/role", verifyToken, isAdmin, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role) return res.status(400).json({ error: "Role is required" });

  const query = `UPDATE users SET role = ? WHERE id = ?`;
  db.query(query, [role, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User role updated successfully" });
  });
});

// -------------------- GET ALL ORDERS (Admin Overview) --------------------
router.get("/orders", verifyToken, isAdmin, (req, res) => {
  const query = `
    SELECT 
      o.id AS order_id,
      u.username AS user_name,
      u.email AS user_email,
      p.name AS product_name,
      o.quantity,
      o.payment_method,
      o.created_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN products p ON o.product_id = p.id
    ORDER BY o.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// -------------------- GET ORDERS BY USER --------------------
router.get("/orders/user/:id", verifyToken, isAdmin, (req, res) => {
  const userId = req.params.id;
  const query = `
    SELECT 
      o.id AS order_id,
      p.name AS product_name,
      o.quantity,
      o.payment_method,
      o.created_at
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ================== ADMIN VIEW ALL ORDERS ==================
router.get('/orders', async (req, res) => {
  try {
    // Get all orders and their associated users
    const [orders] = await db.query(`
      SELECT 
        orders.id AS order_id,
        users.username AS user_name,
        users.email AS user_email,
        orders.total_amount,
        orders.payment_method,
        orders.status,
        orders.created_at
      FROM orders
      JOIN users ON orders.user_id = users.id
      ORDER BY orders.created_at DESC
    `);

    // For each order, fetch ordered items
    for (const order of orders) {
      const [items] = await db.query(`
        SELECT 
          products.name AS product_name,
          order_items.quantity,
          order_items.price
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        WHERE order_items.order_id = ?
      `, [order.order_id]);

      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({ message: "Failed to load orders" });
  }
});


module.exports = router;
