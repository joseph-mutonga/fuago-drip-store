// routes/cartRoutes.js
const express = require("express");
const db = require("../db");
const { verifyToken } = require("../middleware/auth"); // ✅ Correct import
const mpesaService = require("../services/mpesaService");

const router = express.Router();

const httpError = (status, message) => Object.assign(new Error(message), { status });

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
    SELECT cart.id, products.id AS product_id, products.name, products.price, products.image, 
           products.quantity AS product_quantity, cart.quantity,
           products.brand, products.processor, products.ram, products.storage, products.screen_size
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
 * 🔄 UPDATE CART ITEM QUANTITY
 */
router.put("/cart/:id", verifyToken, (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: "Valid quantity required" });
  }

  db.query(
    "UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?",
    [quantity, id, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Item not found" });
      res.json({ message: "Cart updated successfully" });
    }
  );
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
router.post("/checkout", verifyToken, async (req, res) => {
  const user_id = req.user.id;
  const { cart, paymentMethod, checkoutRequestId } = req.body;

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  // Merge duplicates and validate input; prices are always read from the database.
  const wanted = new Map();
  for (const item of cart) {
    const productId = Number(item.product_id);
    const qty = Number(item.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: "Invalid cart item" });
    }
    wanted.set(productId, (wanted.get(productId) || 0) + qty);
  }

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    const ids = [...wanted.keys()];
    const [products] = await conn.query(
      "SELECT id, name, price, quantity FROM products WHERE id IN (?) FOR UPDATE",
      [ids]
    );

    const outOfStock = ids.filter((id) => {
      const p = products.find((row) => row.id === id);
      return !p || p.quantity < wanted.get(id);
    });
    if (outOfStock.length > 0) {
      const names = outOfStock.map((id) => products.find((p) => p.id === id)?.name || `#${id}`);
      throw httpError(400, `Out of stock: ${names.join(", ")}`);
    }

    const totalAmount = products.reduce((sum, p) => sum + Number(p.price) * wanted.get(p.id), 0);

    // M-Pesa orders are only created once Safaricom confirmed the payment.
    let mpesaTx = null;
    if (paymentMethod === "Mpesa") {
      if (!checkoutRequestId) throw httpError(400, "M-Pesa payment reference missing");

      const [txRows] = await conn.query(
        "SELECT * FROM mpesa_transactions WHERE checkout_request_id = ? AND user_id = ? FOR UPDATE",
        [checkoutRequestId, user_id]
      );
      if (txRows.length === 0) throw httpError(404, "M-Pesa transaction not found");
      mpesaTx = txRows[0];

      if (mpesaTx.status !== "COMPLETED") {
        const msg = mpesaTx.status === "PENDING"
          ? "M-Pesa payment has not been confirmed yet. Please complete the prompt on your phone."
          : `M-Pesa payment was not successful${mpesaTx.result_desc ? `: ${mpesaTx.result_desc}` : ""}`;
        throw httpError(402, msg);
      }
      if (mpesaTx.order_id) throw httpError(409, "This M-Pesa payment has already been used for an order");
      if (Number(mpesaTx.amount) !== Math.max(1, Math.round(totalAmount))) {
        throw httpError(400, "Paid amount does not match the cart total");
      }
    }

    for (const [id, qty] of wanted) {
      await conn.query("UPDATE products SET quantity = quantity - ? WHERE id = ?", [qty, id]);
    }

    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?)",
      [user_id, totalAmount, paymentMethod, "Pending"]
    );
    const order_id = orderResult.insertId;

    const orderItems = products.map((p) => [order_id, p.id, wanted.get(p.id), p.price]);
    await conn.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [orderItems]
    );

    if (mpesaTx) {
      await conn.query("UPDATE mpesa_transactions SET order_id = ? WHERE id = ?", [order_id, mpesaTx.id]);
    }

    await conn.query("DELETE FROM cart WHERE user_id = ?", [user_id]);
    await conn.commit();

    res.json({
      message: "✅ Order placed successfully and saved in database.",
      order_id,
      redirect: "/user-dashboard.html",
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (!err.status) console.error("Checkout error:", err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "Checkout failed. Please try again." });
  } finally {
    conn.release();
  }
});

/**
 * 📦 GET ORDERS FOR LOGGED-IN USER
 */
router.get("/orders", verifyToken, (req, res) => {
  const user_id = req.user.id;
  const sql = `
    SELECT o.id AS order_id, o.total_amount, o.status, o.created_at,
           p.name AS product_name, p.image, oi.quantity, oi.price,
           p.brand, p.processor, p.ram, p.storage
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

/**
 * ❌ CANCEL ORDER
 */
router.post("/orders/:id/cancel", verifyToken, (req, res) => {
  const order_id = req.params.id;
  const user_id = req.user.id;

  // Check if order belongs to user and is pending
  db.query(
    "SELECT status FROM orders WHERE id = ? AND user_id = ?",
    [order_id, user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: "Order not found" });

      const status = results[0].status;
      if (status !== 'Pending') {
        return res.status(400).json({ error: "Cannot cancel order that is already processed or delivered." });
      }

      // Update status to Cancelled
      db.query(
        "UPDATE orders SET status = 'Cancelled' WHERE id = ?",
        [order_id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          // Optional: Restore product quantities?
          // For now, simpler to just mark as cancelled.
          res.json({ message: "Order cancelled successfully" });
        }
      );
    }
  );
});

/**
 * 📱 SAFARICOM M-PESA STK PUSH INITIATION
 */
router.post("/mpesa/stkpush", verifyToken, (req, res) => {
  const userId = req.user.id;
  let { phone, amount, cart } = req.body;

  // Fetch registered user's phone from database if not explicitly provided
  db.query("SELECT id, username, email, phone FROM users WHERE id = ?", [userId], async (err, userRows) => {
    if (err) return res.status(500).json({ error: "Database error fetching user profile" });
    if (userRows.length === 0) return res.status(404).json({ error: "User not found" });

    const user = userRows[0];
    const phoneToUse = phone || user.phone;

    if (!phoneToUse) {
      return res.status(400).json({
        error: "No phone number found on your account. Please enter your M-Pesa phone number."
      });
    }

    if (!mpesaService.formatPhoneNumber(phoneToUse)) {
      return res.status(400).json({
        error: "Invalid phone number. Use 07XXXXXXXX, 01XXXXXXXX or 2547XXXXXXXX format."
      });
    }

    try {
      // The amount is always computed from the server-side cart, never from the client.
      const [cartRows] = await db.promise().query(
        "SELECT c.quantity, p.price FROM cart c JOIN products p ON p.id = c.product_id WHERE c.user_id = ?",
        [userId]
      );
      const totalAmount = cartRows.reduce((sum, r) => sum + Number(r.price) * Number(r.quantity), 0);
      if (!totalAmount || totalAmount <= 0) {
        return res.status(400).json({ error: "Your cart is empty" });
      }

      const stkResult = await mpesaService.initiateSTKPush({
        phone: phoneToUse,
        amount: totalAmount,
        accountReference: `Emmyy_${userId}`,
        transactionDesc: "Laptop Order"
      });

      if (!stkResult.success) {
        return res.status(400).json({ error: stkResult.error || "Failed to initiate M-Pesa STK Push" });
      }

      // The transaction must be recorded or the callback can never be matched.
      try {
        await db.promise().query(
          "INSERT INTO mpesa_transactions (user_id, phone, amount, merchant_request_id, checkout_request_id, status) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, stkResult.phone, stkResult.amount, stkResult.merchantRequestId, stkResult.checkoutRequestId, 'PENDING']
        );
      } catch (txErr) {
        console.error("Error logging M-Pesa transaction:", txErr);
        return res.status(500).json({ error: "Payment prompt was sent but could not be recorded. Please do not pay; try again." });
      }

      return res.json({
        success: true,
        message: stkResult.customerMessage,
        checkoutRequestId: stkResult.checkoutRequestId,
        phone: stkResult.phone,
        amount: stkResult.amount
      });
    } catch (stkErr) {
      console.error("STK Push error:", stkErr);
      return res.status(stkErr.status || 502).json({ error: stkErr.message || "Failed to initiate M-Pesa payment" });
    }
  });
});

/**
 * 📩 SAFARICOM M-PESA CALLBACK WEBHOOK
 */
router.post("/mpesa/callback", async (req, res) => {
  if (!mpesaService.isValidCallbackSecret(req.query.secret)) {
    console.warn("M-Pesa callback rejected: bad secret");
    return res.status(403).json({ ResultCode: 1, ResultDesc: "Forbidden" });
  }

  const cb = req.body?.Body?.stkCallback;
  if (!cb || !cb.CheckoutRequestID || cb.ResultCode === undefined) {
    console.warn("M-Pesa callback ignored: malformed payload");
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  try {
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = cb;
    const code = Number(ResultCode);

    const meta = {};
    for (const item of (CallbackMetadata && CallbackMetadata.Item) || []) {
      meta[item.Name] = item.Value;
    }

    const [rows] = await db.promise().query(
      "SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?",
      [CheckoutRequestID]
    );
    if (rows.length === 0) {
      console.warn("M-Pesa callback for unknown CheckoutRequestID:", CheckoutRequestID);
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const tx = rows[0];
    let status;
    let desc = ResultDesc || null;
    let receipt = null;

    if (code === 0) {
      receipt = meta.MpesaReceiptNumber || null;
      const paid = Number(meta.Amount);
      if (!receipt) {
        status = "FAILED";
        desc = "Callback success without a receipt number";
      } else if (!Number.isFinite(paid) || paid !== Number(tx.amount)) {
        status = "FAILED";
        desc = `Amount mismatch: expected ${tx.amount}, received ${meta.Amount}`;
        console.error("M-Pesa amount mismatch for", CheckoutRequestID, "receipt", receipt);
      } else {
        status = "COMPLETED";
      }
    } else if (code === 1032) {
      status = "CANCELLED";
    } else {
      status = "FAILED";
    }

    // Only a still-pending transaction can change state (idempotent against retries)
    await db.promise().query(
      "UPDATE mpesa_transactions SET status = ?, result_code = ?, result_desc = ?, mpesa_receipt_number = ? WHERE checkout_request_id = ? AND status = 'PENDING'",
      [status, code, desc ? String(desc).substring(0, 255) : null, receipt, CheckoutRequestID]
    );

    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (e) {
    console.error("M-Pesa callback processing error:", e);
    // Non-2xx so Safaricom may retry
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
});

/**
 * 🔍 CHECK M-PESA TRANSACTION STATUS
 */
const lastQueryAt = new Map();

router.get("/mpesa/status/:checkoutRequestId", verifyToken, async (req, res) => {
  const checkoutRequestId = req.params.checkoutRequestId;
  const pool = db.promise();
  try {
    const load = async () => {
      const [rows] = await pool.query(
        "SELECT status, result_code, result_desc, mpesa_receipt_number, order_id, TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age FROM mpesa_transactions WHERE checkout_request_id = ? AND user_id = ?",
        [checkoutRequestId, req.user.id]
      );
      return rows[0];
    };

    let tx = await load();
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    if (tx.status === "PENDING" && tx.age >= 5 && mpesaService.isSimulatedCheckoutId(checkoutRequestId)) {
      await pool.query(
        "UPDATE mpesa_transactions SET status='COMPLETED', result_code=0, result_desc='Simulated success', mpesa_receipt_number=? WHERE checkout_request_id=? AND status='PENDING'",
        [`SIM${Date.now().toString(36).toUpperCase()}`, checkoutRequestId]
      );
      tx = await load();
    } else if (tx.status === "PENDING" && tx.age >= 20 && !mpesaService.isSimulationMode()) {
      // Callback may have been lost: ask Safaricom directly (rate-limited)
      const last = lastQueryAt.get(checkoutRequestId) || 0;
      if (Date.now() - last >= 10000) {
        lastQueryAt.set(checkoutRequestId, Date.now());
        try {
          const q = await mpesaService.queryStkStatus(checkoutRequestId);
          // A query cannot provide the receipt, so success is only ever taken from the callback.
          if (q.state === "CANCELLED" || q.state === "FAILED") {
            await pool.query(
              "UPDATE mpesa_transactions SET status=?, result_code=?, result_desc=? WHERE checkout_request_id=? AND status='PENDING'",
              [q.state, q.resultCode, String(q.resultDesc || "").substring(0, 255), checkoutRequestId]
            );
            tx = await load();
          }
        } catch (e) {
          console.warn("STK status query failed:", e.message);
        }
      }
    }

    res.json({
      status: tx.status,
      result_code: tx.result_code,
      result_desc: tx.result_desc,
      mpesa_receipt_number: tx.mpesa_receipt_number,
      order_id: tx.order_id
    });
  } catch (err) {
    console.error("M-Pesa status error:", err);
    res.status(500).json({ error: "Could not check payment status" });
  }
});

module.exports = router;
