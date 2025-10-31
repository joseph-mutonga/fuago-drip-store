const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_secret_key_here";

// ✅ Verify Token Middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded; // { id, username, role }
    next();
  });
}

// ✅ Check if user is Admin
function isAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
}

module.exports = { verifyToken, isAdmin };
