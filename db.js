// db.js
const mysql = require("mysql2");

// Create a connection pool for better performance
const db = mysql.createPool({
  host: "localhost",
  user: "root",           // replace with your MySQL username
  password: "38556016ab",           // replace with your MySQL password
  database: "image_upload_db", // replace with your DB name
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 50
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
  } else {
    console.log("✅ MySQL connected");
    connection.release();
  }
});

module.exports = db;
