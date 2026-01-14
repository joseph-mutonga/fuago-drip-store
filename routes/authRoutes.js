// routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

const JWT_SECRET = "your_secret_key_here";

// -------------------- REGISTER --------------------
router.post("/register", (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Register DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = role && (role === "admin" || role === "user") ? role : "user";

      db.query(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, userRole],
        (err2) => {
          if (err2) {
            console.error("Insert user error:", err2);
            return res.status(500).json({ error: "Error saving user" });
          }
          return res.status(201).json({ message: "User registered successfully" });
        }
      );
    } catch (hashErr) {
      console.error("Hash error:", hashErr);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

// -------------------- LOGIN --------------------
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Login DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "2h" }
      );

      // ✅ Updated login response to clearly indicate role
      return res.json({
        message: "Login successful",
        token,
        username: user.username,
        role: user.role,
        redirect: user.role === "admin" ? "upload.html" : "user-dashboard.html",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (compErr) {
      console.error("Password compare error:", compErr);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

// -------------------- verifyToken middleware --------------------
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verify error:", err);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

// -------------------- get current user --------------------
router.get("/me", verifyToken, (req, res) => {
  const userId = req.user.id;

  // Get user basic info
  db.query("SELECT id, username, email, role, created_at FROM users WHERE id = ?", [userId], (err, userResults) => {
    if (err) {
      console.error("Get /me DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResults[0];

    // Get user's total orders count
    db.query("SELECT COUNT(*) as orderCount FROM orders WHERE user_id = ?", [userId], (err2, orderResults) => {
      if (err2) {
        console.error("Get orders count error:", err2);
        // Still return user info even if order count fails
        return res.json(user);
      }

      // Add order count to user object
      user.totalOrders = orderResults[0].orderCount || 0;

      // Get user's cart items count
      db.query("SELECT COUNT(*) as cartCount FROM cart WHERE user_id = ?", [userId], (err3, cartResults) => {
        if (err3) {
          console.error("Get cart count error:", err3);
          // Return user info with order count but without cart count
          return res.json(user);
        }

        user.cartItems = cartResults[0].cartCount || 0;
        return res.json(user);
      });
    });
  });
});

module.exports = router;
