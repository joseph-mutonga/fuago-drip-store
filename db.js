// db.js
require('dotenv').config();
const mysql = require("mysql2");

// Create a connection pool for better performance
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "image_upload_db",
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 30,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 50
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
    console.error("Please check your .env file and ensure MySQL is running");
  } else {
    console.log("✅ MySQL connected successfully");
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    connection.release();
  }
});

module.exports = db;
