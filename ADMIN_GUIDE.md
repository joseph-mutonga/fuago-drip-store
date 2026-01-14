# 👤 Admin User Guide

## 🔐 Admin Login Credentials

**Email:** `admin@gmail.com`  
**Password:** `admin`

---

## 🎯 Admin Capabilities

### ✅ Product Management

#### 1. **Add New Products**
- Navigate to: Admin Dashboard (`/upload.html`)
- Fill in product details:
  - Product Name
  - Description
  - Price
  - Quantity (stock)
  - Upload product image
- Click "Upload Product"
- Product will appear immediately in the product list

#### 2. **Edit Existing Products**
- View products list in admin dashboard
- Click "Edit" button on any product
- Update any field:
  - Name
  - Description
  - Price
  - Quantity
  - Image (optional - keep existing or upload new)
- Click "Update Product"
- Changes take effect immediately

#### 3. **Delete Products**
- Click "Delete" button on any product
- Product and its image will be removed from database
- Customers' carts will be updated automatically

---

### 📊 Order Management & Tracking

#### 1. **View All Customer Orders**
- Access: `/admin/orders` endpoint
- See all orders from all customers
- Order details include:
  - Order ID
  - Customer name & email
  - Products ordered
  - Quantities
  - Total amount
  - Payment method
  - Order status
  - Order date

#### 2. **Track Order Progress**
- Monitor order status:
  - ⏳ **Pending** - Just placed
  - 🔄 **Processing** - Being prepared
  - 📦 **Shipped** - On the way
  - ✅ **Delivered** - Completed
  - ❌ **Cancelled** - Cancelled
- Update order status as needed
- Customers see real-time updates

#### 3. **Order Analytics**
- View order patterns
- Track sales performance
- Monitor customer activity
- Manage inventory based on orders

---

### 👥 User Management

#### 1. **View All Users**
- Access: `/admin/users` endpoint
- See complete user list with:
  - User ID
  - Username
  - Email
  - Role (admin/user)
  - Order count
  - Registration date

#### 2. **Manage User Roles**
- Promote users to admin
- Demote admins to users
- Endpoint: `PUT /admin/user/:id/role`

#### 3. **Delete Users**
- Remove user accounts
- Associated orders remain for records
- Endpoint: `DELETE /admin/user/:id`

---

## 🖥️ Admin Dashboard Features

### Main Dashboard (`/upload.html`)

**Navigation:**
1. Product Upload Form (top section)
2. Product Management Grid (main section)
3. User List (sidebar - if implemented)

**Quick Actions:**
- 📤 Upload new product
- ✏️ Edit product
- 🗑️ Delete product
- 👁️ View product details
- 📊 Check stock levels

---

## 🔐 Admin-Only API Endpoints

### Product Endpoints
```
POST   /upload          - Add new product
POST   /update/:id      - Update product
DELETE /delete/:id      - Delete product
GET    /products        - View all products
GET    /product/:id     - View single product
```

### Admin Management Endpoints
```
GET    /admin/users           - Get all users
GET    /admin/user/:id        - Get specific user
DELETE /admin/user/:id        - Delete user
PUT    /admin/user/:id/role   - Update user role
GET    /admin/orders          - Get all orders
GET    /admin/orders/user/:id - Get orders by user
```

---

## 🛡️ Security Features

### Admin has additional security:
- ✅ **JWT Token Authentication** - Must be logged in
- ✅ **Role Verification** - `isAdmin` middleware checks role
- ✅ **Secure Password** - bcrypt hashed
- ✅ **Protected Routes** - Normal users cannot access admin endpoints

### Best Practices:
1. **Change default password** after first login
2. **Log out** when finished with admin tasks
3. **Monitor user activity** regularly
4. **Review orders** daily
5. **Keep inventory updated**

---

## 📈 Workflow Examples

### Example 1: Adding a New Product
```
1. Login as admin (admin@gmail.com / admin)
2. Navigate to upload.html
3. Fill product form:
   - Name: "New Laptop"
   - Description: "High-performance laptop"
   - Price: 45000
   - Quantity: 10
   - Image: Upload laptop.jpg
4. Click "Upload Product"
5. Product appears in list and is visible to customers
```

### Example 2: Processing an Order
```
1. Customer places order
2. Admin receives notification (if implemented)
3. Admin views order in /admin/orders
4. Admin checks:
   - Items ordered
   - Customer details
   - Payment method
5. Admin updates status: Pending → Processing → Shipped
6. Customer sees delivery countdown
7. After delivery, status: Delivered
```

### Example 3: Managing Stock
```
1. Admin views products
2. Identifies low stock items (quantity < 5)
3. Clicks "Edit" on product
4. Updates quantity to restock
5. Saves changes
6. Product available for purchase again
```

---

## 🎨 Admin Dashboard Access

### How to Access:
1. Go to: `http://localhost:3000/login.html`
2. Enter: 
   - Email: `admin@gmail.com`
   - Password: `admin`
3. Click "Login"
4. Automatically redirected to `/upload.html`
5. Full admin dashboard loads

### What You'll See:
- **Header:** Admin navigation
- **Upload Form:** Add new products
- **Product Grid:** All products with edit/delete options
- **Statistics:** Order counts, user counts (if implemented)

---

## 🚨 Troubleshooting

### Issue: Cannot login as admin
**Solution:** 
- Verify credentials are exact: `admin@gmail.com` / `admin`
- Check database: Run `node test-database.js`
- Ensure admin role is set in database

### Issue: Cannot add products
**Solution:**
- Check file upload permissions on `/uploads` folder
- Verify form fields are filled correctly
- Check browser console for errors

### Issue: Cannot see orders
**Solution:**
- Ensure customers have placed orders
- Check API endpoint: `GET /admin/orders`
- Verify admin authentication token

---

## 📝 Admin Checklist

Daily Tasks:
- [ ] Review new orders
- [ ] Update order statuses
- [ ] Check stock levels
- [ ] Monitor user registrations

Weekly Tasks:
- [ ] Add new products if needed
- [ ] Remove out-of-stock items
- [ ] Review sales analytics
- [ ] Clean up old orders (if needed)

Monthly Tasks:
- [ ] Review user accounts
- [ ] Update product descriptions
- [ ] Check system performance
- [ ] Backup database

---

## 🎯 Admin Privileges Summary

| Feature | Admin | User |
|---------|-------|------|
| Add Products | ✅ | ❌ |
| Edit Products | ✅ | ❌ |
| Delete Products | ✅ | ❌ |
| View All Orders | ✅ | ❌ (own only) |
| Manage Users | ✅ | ❌ |
| Change Roles | ✅ | ❌ |
| View Analytics | ✅ | ❌ |
| Browse Products | ✅ | ✅ |
| Place Orders | ✅ | ✅ |

---

**Remember:** With great power comes great responsibility! Use admin privileges wisely. 🦸‍♂️

---

**Last Updated:** January 11, 2026  
**Admin Email:** admin@gmail.com  
**Support:** Check main README.md for technical details
