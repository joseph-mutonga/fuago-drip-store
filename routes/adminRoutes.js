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
// -------------------- GET ALL ORDERS (Admin Overview) --------------------
router.get("/orders", verifyToken, isAdmin, (req, res) => {
  const ordersQuery = `
    SELECT 
      o.id AS order_id,
      u.username AS user_name,
      u.email AS user_email,
      o.total_amount,
      o.payment_method,
      o.status,
      o.created_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  db.query(ordersQuery, (err, orders) => {
    if (err) {
      console.error("Error fetching admin orders:", err);
      return res.status(500).json({ error: err.message });
    }

    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map(o => o.order_id);
    const itemsQuery = `
      SELECT 
        oi.order_id,
        p.name AS product_name,
        oi.quantity,
        oi.price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id IN (${orderIds.join(',')})
    `;

    db.query(itemsQuery, (err2, items) => {
      if (err2) {
        console.error("Error fetching order items:", err2);
        return res.status(500).json({ error: err2.message });
      }

      const ordersWithItems = orders.map(order => {
        order.items = items.filter(item => item.order_id === order.order_id);
        return order;
      });

      res.json(ordersWithItems);
    });
  });
});

// -------------------- UPDATE ORDER STATUS --------------------
router.put("/orders/:id/status", verifyToken, isAdmin, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const query = "UPDATE orders SET status = ? WHERE id = ?";
  db.query(query, [status, orderId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order status updated successfully", status });
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
      o.status,
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

module.exports = router;
