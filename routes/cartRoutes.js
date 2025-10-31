// routes/cartRoutes.js
const express = require("express");
const db = require("../db");
const { verifyToken } = require("../middleware/auth"); // ✅ Correct import

const router = express.Router();

/**
 * 🛒 ADD TO CART
 */
router.post("/cart/add", verifyToken, (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;

  if (!product_id) return res.status(400).json({ error: "Product ID required" });

  db.query(
    "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
    [user_id, product_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length > 0) {
        db.query(
          "UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?",
          [user_id, product_id],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Product quantity updated in cart" });
          }
        );
      } else {
        db.query(
          "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)",
          [user_id, product_id],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Product added to cart" });
          }
        );
      }
    }
  );
});

/**
 * 📋 VIEW CART ITEMS
 */
router.get("/cart", verifyToken, (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT cart.id, products.id AS product_id, products.name, products.price, products.image, products.quantity AS product_quantity, cart.quantity
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * ❌ REMOVE ITEM FROM CART
 */
router.delete("/cart/:id", verifyToken, (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;

  db.query(
    "DELETE FROM cart WHERE id = ? AND user_id = ?",
    [id, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Item not found" });
      res.json({ message: "Item removed from cart" });
    }
  );
});

/**
 * 🧹 CLEAR ALL CART ITEMS
 */
router.delete("/cart/clear", verifyToken, (req, res) => {
  const user_id = req.user.id;
  db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Cart cleared successfully" });
  });
});

/**
 * 💳 PROCESS CHECKOUT (PLACE ORDER)
 */
router.post("/checkout", verifyToken, (req, res) => {
  const user_id = req.user.id;
  const { cart, paymentMethod } = req.body;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  // Step 1: Check stock for each product
  const productIds = cart.map((item) => item.product_id);
  db.query(
    `SELECT id, quantity FROM products WHERE id IN (${productIds.map(() => "?").join(",")})`,
    productIds,
    (err, products) => {
      if (err) return res.status(500).json({ error: err.message });

      const outOfStock = cart.filter((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return !product || product.quantity < item.quantity;
      });

      if (outOfStock.length > 0) {
        return res.status(400).json({
          error: `Out of stock: ${outOfStock.map((i) => i.name).join(", ")}`,
        });
      }

      // Step 2: Subtract quantity from products
      const updatePromises = cart.map((item) => {
        return new Promise((resolve, reject) => {
          db.query(
            "UPDATE products SET quantity = quantity - ? WHERE id = ?",
            [item.quantity, item.product_id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      });

      Promise.all(updatePromises)
        .then(() => {
          // Step 3: Clear user's cart
          db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Step 4: Record order in orders and order_items tables
            const totalAmount = cart.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            db.query(
              "INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?)",
              [user_id, totalAmount, paymentMethod, "Pending"],
              (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                const order_id = result.insertId;
                const orderItems = cart.map((item) => [
                  order_id,
                  item.product_id,
                  item.quantity,
                  item.price,
                ]);

                db.query(
                  "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
                  [orderItems],
                  (err2) => {
                    if (err2)
                      return res.status(500).json({ error: err2.message });

                    res.json({
                      message:
                        "✅ Order placed successfully and saved in database.",
                      redirect: "/user-dashboard.html",
                    });
                  }
                );
              }
            );
          });
        })
        .catch((err) => res.status(500).json({ error: err.message }));
    }
  );
});

/**
 * 📦 GET ORDERS FOR LOGGED-IN USER
 */
router.get("/orders", verifyToken, (req, res) => {
  const user_id = req.user.id;
  const sql = `
    SELECT o.id AS order_id, o.total_amount, o.status, o.created_at,
           p.name AS product_name, p.image, oi.quantity, oi.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
