# API Endpoint Documentation
## Milk Ordering and Delivery Management System

### Base URL
```
http://localhost:3000/api
```

---

## Authentication Endpoints

### 1. Register New Customer
**Endpoint:** `POST /api/auth/register`  
**Access:** Public  
**Description:** Register a new customer account

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "secure123",
  "full_name": "John Customer",
  "phone": "+254712345678",
  "address": "123 Main Street, Apt 4B",
  "city": "Nairobi",
  "postal_code": "00100",
  "delivery_instructions": "Leave at front door"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": 10,
    "email": "customer@example.com",
    "full_name": "John Customer",
    "role": "customer",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. User Login
**Endpoint:** `POST /api/auth/login`  
**Access:** Public  
**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "admin@milkdelivery.com",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 1,
    "email": "admin@milkdelivery.com",
    "full_name": "System Administrator",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get User Profile
**Endpoint:** `GET /api/auth/profile`  
**Access:** Private (All authenticated users)  
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "admin@milkdelivery.com",
    "role": "admin",
    "full_name": "System Administrator",
    "phone": "+254700000000",
    "is_active": true,
    "created_at": "2026-01-16T10:00:00.000Z"
  }
}
```

---

## Product Endpoints

### 4. Get All Products
**Endpoint:** `GET /api/products`  
**Access:** Public  
**Query Parameters:**
- `available_only=true` (optional) - Filter only available products

**Success Response (200):**
```json
{
  "success": true,
  "count": 9,
  "data": [
    {
      "product_id": 1,
      "product_name": "Fresh Whole Milk 500ml",
      "product_type": "whole_milk",
      "description": "Farm fresh whole milk in 500ml bottles",
      "unit_size": 0.5,
      "price_per_unit": "60.00",
      "stock_quantity": 500,
      "min_stock_level": 100,
      "is_available": true,
      "created_at": "2026-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 5. Create Product (Admin Only)
**Endpoint:** `POST /api/products`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "product_name": "Premium Organic Milk 2L",
  "product_type": "organic",
  "description": "100% organic whole milk in 2L bottles",
  "unit_size": 2.0,
  "price_per_unit": 250.00,
  "stock_quantity": 100,
  "min_stock_level": 20,
  "is_available": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product_id": 10,
    "product_name": "Premium Organic Milk 2L",
    "product_type": "organic",
    "unit_size": 2.0,
    "price_per_unit": "250.00",
    "is_available": true
  }
}
```

---

### 6. Get Low Stock Products (Admin Only)
**Endpoint:** `GET /api/products/low-stock`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "product_id": 5,
      "product_name": "Skim Milk 500ml",
      "stock_quantity": 45,
      "min_stock_level": 60
    }
  ]
}
```

---

## Order Endpoints

### 7. Create Order
**Endpoint:** `POST /api/orders`  
**Access:** Private (Customer or Admin)  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "order_type": "weekly",
  "delivery_address": "123 Main Street, Nairobi",
  "delivery_date": "2026-01-20",
  "delivery_time_slot": "morning",
  "special_instructions": "Call before delivery",
  "items": [
    {
      "product_id": 2,
      "quantity": 5
    },
    {
      "product_id": 8,
      "quantity": 2
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 25,
    "total_amount": "720.00",
    "item_count": 2
  }
}
```

---

### 8. Get All Orders
**Endpoint:** `GET /api/orders`  
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:**
- `status` - Filter by order status (pending, processing, delivered, etc.)
- `type` - Filter by order type (daily, weekly, monthly, one_time)
- `limit` - Limit number of results

**Success Response (200):**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "order_id": 1,
      "customer_name": "Alice Johnson",
      "customer_phone": "+254703333333",
      "order_type": "weekly",
      "order_status": "delivered",
      "total_amount": "220.00",
      "delivery_date": "2026-01-10",
      "order_date": "2026-01-09T12:00:00.000Z",
      "item_count": 1
    }
  ]
}
```

---

### 9. Get Order Details
**Endpoint:** `GET /api/orders/:id`  
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "customer_id": 1,
    "customer_name": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "+254703333333",
    "order_type": "weekly",
    "order_status": "delivered",
    "total_amount": "220.00",
    "delivery_address": "123 Main Street, Apt 4B, Nairobi",
    "delivery_date": "2026-01-10",
    "delivery_time_slot": "morning",
    "items": [
      {
        "order_item_id": 1,
        "product_id": 2,
        "product_name": "Fresh Whole Milk 1L",
        "product_type": "whole_milk",
        "unit_size": 1.0,
        "quantity": 2,
        "unit_price": "110.00",
        "subtotal": "220.00"
      }
    ]
  }
}
```

---

### 10. Update Order Status
**Endpoint:** `PUT /api/orders/:id/status`  
**Access:** Admin or Delivery Staff  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "processing"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order_id": 1,
    "order_status": "processing"
  }
}
```

---

### 11. Cancel Order
**Endpoint:** `PUT /api/orders/:id/cancel`  
**Access:** Private (Owner or Admin)  
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## Delivery Endpoints

### 12. Create Delivery Assignment
**Endpoint:** `POST /api/deliveries`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "order_id": 25,
  "staff_id": 1,
  "scheduled_delivery": "2026-01-20T07:00:00",
  "delivery_notes": "Morning delivery - North Zone"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Delivery assigned successfully",
  "data": {
    "delivery_id": 10,
    "order_id": 25,
    "staff_name": "John Doe",
    "scheduled_delivery": "2026-01-20T07:00:00.000Z",
    "delivery_status": "assigned"
  }
}
```

---

### 13. Update Delivery Status
**Endpoint:** `PUT /api/deliveries/:id/status`  
**Access:** Admin or Delivery Staff  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "in_transit",
  "notes": "Package picked up, en route to customer"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Delivery status updated successfully",
  "data": {
    "delivery_id": 10,
    "delivery_status": "in_transit"
  }
}
```

---

### 14. Mark as Delivered
**Endpoint:** `PUT /api/deliveries/:id/delivered`  
**Access:** Admin or Delivery Staff  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "customer_signature": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Delivery marked as delivered",
  "data": {
    "delivery_id": 10,
    "delivery_status": "delivered",
    "actual_delivery": "2026-01-20T07:15:00.000Z"
  }
}
```

---

## Report Endpoints

### 15. Get Dashboard Summary
**Endpoint:** `GET /api/reports/dashboard?start_date=2026-01-01&end_date=2026-01-16`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_revenue": "5420.00",
    "total_orders": 45,
    "delivered_orders": 38,
    "pending_orders": 5,
    "cancelled_orders": 2,
    "total_customers": 15,
    "total_products_sold": 250
  }
}
```

---

### 16. Get Daily Sales Report
**Endpoint:** `GET /api/reports/sales/daily?date=2026-01-15`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sale_date": "2026-01-15",
    "total_orders": 8,
    "total_quantity_sold": 45,
    "total_revenue": "1250.00",
    "unique_customers": 6,
    "avg_order_value": "156.25"
  }
}
```

---

### 17. Get Sales Report by Date Range
**Endpoint:** `GET /api/reports/sales/range?start_date=2026-01-01&end_date=2026-01-15`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Success Response (200):**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "sale_date": "2026-01-15",
      "total_orders": 8,
      "total_quantity_sold": 45,
      "total_revenue": "1250.00",
      "unique_customers": 6,
      "avg_order_value": "156.25"
    },
    {
      "sale_date": "2026-01-14",
      "total_orders": 12,
      "total_quantity_sold": 68,
      "total_revenue": "1890.00",
      "unique_customers": 9,
      "avg_order_value": "157.50"
    }
  ]
}
```

---

### 18. Get Product Sales Report
**Endpoint:** `GET /api/reports/products?start_date=2026-01-01&end_date=2026-01-16`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Success Response (200):**
```json
{
  "success": true,
  "count": 9,
  "data": [
    {
      "product_id": 2,
      "product_name": "Fresh Whole Milk 1L",
      "product_type": "whole_milk",
      "unit_size": 1.0,
      "price_per_unit": "110.00",
      "times_ordered": 45,
      "total_quantity_sold": 120,
      "total_revenue": "13200.00",
      "avg_selling_price": "110.00"
    }
  ]
}
```

---

### 19. Get Top Selling Products
**Endpoint:** `GET /api/reports/top-products?limit=5&start_date=2026-01-01&end_date=2026-01-16`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "product_id": 2,
      "product_name": "Fresh Whole Milk 1L",
      "product_type": "whole_milk",
      "total_sold": 120,
      "total_revenue": "13200.00"
    }
  ]
}
```

---

### 20. Export Report to CSV
**Endpoint:** `GET /api/reports/export?report_type=sales&start_date=2026-01-01&end_date=2026-01-16`  
**Access:** Admin  
**Headers:** `Authorization: Bearer <admin_token>`  
**Query Parameters:**
- `report_type` - Type of report: sales, products, customers
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)

**Success Response (200):**
- Content-Type: `text/csv`
- Downloads CSV file with report data

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. Required roles: admin"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Order not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., duplicate entry)
- `500` - Internal Server Error
