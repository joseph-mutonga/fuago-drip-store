# Database Setup & Connection Guide

## Overview
This guide will walk you through setting up MySQL database for your e-commerce application and connecting it with both frontend and backend.

---

## 📋 Prerequisites Checklist

- [ ] MySQL Community Server installed
- [ ] Node.js installed (v14+)
- [ ] Project dependencies installed (`npm install`)
- [ ] `.env` file configured

---

## 🔧 Step-by-Step Setup

### Step 1: Install MySQL Community Server

1. Download MySQL Community Server from: https://dev.mysql.com/downloads/mysql/
2. Install with the following settings:
   - Choose "Custom" installation
   - Select "MySQL Server" and "MySQL Workbench"
   - Set root password (remember this!)
   - Configure as Windows Service (auto-start)

3. Verify installation:
   ```powershell
   mysql --version
   ```

### Step 2: Start MySQL Service

**Windows:**
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "MySQL80" in the list
3. Right-click → Start (if not running)

**Command Line:**
```powershell
net start MySQL80
```

### Step 3: Configure Environment Variables

1. Open `.env` file in the project root
2. Update with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=image_upload_db
   ```

### Step 4: Run Database Setup

Execute the setup script:
```bash
npm run setup-db
```

This script will:
- ✅ Create database `image_upload_db`
- ✅ Create tables: users, products, cart, orders, order_items
- ✅ Add indexes for performance
- ✅ Insert default admin user
- ✅ Add sample products

### Step 5: Verify Database Setup

Run the verification script:
```bash
npm run test-db
```

You should see:
```
✅ Connection test PASSED
📋 Checking database tables...
  1. users
  2. products
  3. cart
  4. orders
  5. order_items

📊 Record counts:
  users          : 1 record(s)
  products       : 3 record(s)
  ...
```

### Step 6: Start the Server

Start in development mode:
```bash
npm run dev
```

You should see:
```
✅ MySQL connected successfully
📊 Database: image_upload_db
✅ Login Server running at http://localhost:3000
```

---

## 🌐 Frontend-Backend Connection

### How It Works

#### 1. **Backend (Node.js/Express)**
   - **Database Connection** (`db.js`)
     - Uses MySQL2 connection pool
     - Configured via environment variables
     - Automatic retry on connection loss
   
   - **API Routes**
     - `/auth/*` - Authentication endpoints
     - `/products` - Product CRUD operations
     - `/user/*` - User cart and orders
     - `/admin/*` - Admin management

#### 2. **Frontend (HTML/JavaScript)**
   - **Connection Method**: Fetch API
   - **Base URL**: `http://localhost:3000`
   - **Authentication**: JWT tokens in headers

#### 3. **Data Flow Example**

**User Login Flow:**
```
[Frontend] login.html
    ↓ (POST /auth/login)
[Backend] authRoutes.js
    ↓ (Query users table)
[Database] MySQL
    ↑ (Return user data)
[Backend] Generate JWT token
    ↑ (Return token + user info)
[Frontend] Store token, redirect to dashboard
```

**Add to Cart Flow:**
```
[Frontend] user-dashboard.html
    ↓ (POST /user/cart/add with JWT)
[Backend] cartRoutes.js → verifyToken middleware
    ↓ (Insert/Update cart table)
[Database] MySQL
    ↑ (Success response)
[Frontend] Update cart count
```

---

## 🗄️ Database Schema Details

### Table: users
```sql
- id (PK, AUTO_INCREMENT)
- username
- email (UNIQUE)
- password (bcrypt hashed)
- role (ENUM: 'user', 'admin')
- created_at, updated_at
```

### Table: products
```sql
- id (PK, AUTO_INCREMENT)
- name
- description
- price (DECIMAL)
- quantity (INT)
- image (VARCHAR)
- created_at, updated_at
```

### Table: cart
```sql
- id (PK, AUTO_INCREMENT)
- user_id (FK → users.id)
- product_id (FK → products.id)
- quantity
- created_at, updated_at
```

### Table: orders
```sql
- id (PK, AUTO_INCREMENT)
- user_id (FK → users.id)
- total_amount (DECIMAL)
- payment_method
- status (ENUM)
- created_at, updated_at
```

### Table: order_items
```sql
- id (PK, AUTO_INCREMENT)
- order_id (FK → orders.id)
- product_id (FK → products.id)
- quantity
- price (DECIMAL)
- created_at
```

---

## 🔐 Security Features

### Backend Security
1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Authentication**: 2-hour token expiry
3. **SQL Injection Prevention**: Parameterized queries
4. **CORS Protection**: Configured for allowed origins
5. **Role-based Access Control**: Middleware guards

### Frontend Security
1. **Token Storage**: localStorage (consider httpOnly cookies for production)
2. **Authorization Headers**: Bearer token in all authenticated requests
3. **Input Validation**: Client-side validation before API calls
4. **XSS Prevention**: Proper escaping of user input

---

## 🧪 Testing the Connection

### Manual Tests

#### Test 1: Check Database Connection
```bash
npm run test-db
```

#### Test 2: Test Authentication API
```bash
# Login (PowerShell)
$body = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

#### Test 3: Test Product API
```bash
# Get all products
Invoke-WebRequest -Uri "http://localhost:3000/products" -Method GET
```

#### Test 4: Frontend Access
Open browser:
1. `http://localhost:3000` - Landing page
2. `http://localhost:3000/login.html` - Login page
3. Login with admin credentials
4. Should redirect to `upload.html` (Admin Dashboard)

---

## 🐛 Troubleshooting

### Issue 1: "MySQL connection error"

**Causes:**
- MySQL service not running
- Wrong credentials in `.env`
- Firewall blocking connection

**Solutions:**
1. Start MySQL service:
   ```powershell
   net start MySQL80
   ```
2. Verify credentials:
   ```bash
   mysql -u root -p
   ```
3. Check `.env` file matches MySQL credentials

### Issue 2: "ECONNREFUSED ::1:3306"

**Cause:** MySQL not listening on IPv6

**Solution:**
Change `.env`:
```env
DB_HOST=127.0.0.1
```

### Issue 3: "Table doesn't exist"

**Cause:** Database not initialized

**Solution:**
```bash
npm run setup-db
```

### Issue 4: "Cannot GET /"

**Cause:** Server not running or wrong port

**Solution:**
1. Check if server is running:
   ```bash
   npm run dev
   ```
2. Verify port in browser matches `.env` PORT

### Issue 5: Frontend can't reach backend

**Causes:**
- CORS issues
- Wrong API URLs in frontend
- Server not running

**Solutions:**
1. Ensure server is running on correct port
2. Check browser console for errors
3. Verify fetch URLs in `script.js` match server address
4. Clear browser cache

---

## 📊 Useful SQL Commands

### View all users:
```sql
USE image_upload_db;
SELECT id, username, email, role FROM users;
```

### View all products:
```sql
SELECT id, name, price, quantity FROM products;
```

### View orders with user details:
```sql
SELECT o.id, u.username, o.total_amount, o.status, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;
```

### Reset admin password:
```sql
-- New password: admin123
UPDATE users 
SET password = '$2a$10$4kP0z8h7LZvXvG3KPYrH8OQI.Y9CKVZFWWcqXFh8lYvGlOmPK2Sg2'
WHERE email = 'admin@example.com';
```

---

## 🚀 Production Deployment Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET to strong random string
- [ ] Enable HTTPS
- [ ] Use environment-specific `.env` files
- [ ] Implement rate limiting
- [ ] Set up database backups
- [ ] Use connection pooling (already configured)
- [ ] Add logging middleware
- [ ] Implement error tracking (e.g., Sentry)
- [ ] Use httpOnly cookies instead of localStorage for tokens
- [ ] Enable MySQL SSL connections
- [ ] Set up monitoring (uptime, performance)

---

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Best Practices](https://jwt.io/introduction)
- [MySQL2 Node.js](https://github.com/sidorares/node-mysql2)

---

## ✅ Success Checklist

Your setup is complete when you can:

- [ ] Run `npm run test-db` successfully
- [ ] Access frontend at `http://localhost:3000`
- [ ] Login with admin credentials
- [ ] View products on admin dashboard
- [ ] Add products as admin
- [ ] Register new user account
- [ ] Login as user and add items to cart
- [ ] Complete checkout process
- [ ] View order history

---

**Need Help?** Check the troubleshooting section or review error logs in the terminal.
