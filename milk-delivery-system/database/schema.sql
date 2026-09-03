-- =========================================================
-- MILK ORDERING AND DELIVERY MANAGEMENT SYSTEM
-- Database Schema - MySQL Community Server
-- =========================================================

-- Drop existing database if exists
DROP DATABASE IF EXISTS milk_delivery_db;

-- Create database
CREATE DATABASE milk_delivery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE milk_delivery_db;

-- =========================================================
-- TABLE: users
-- Stores authentication and user role information
-- =========================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer', 'delivery_staff') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: customers
-- Extended customer information
-- =========================================================
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    delivery_instructions TEXT,
    customer_since DATE DEFAULT (CURRENT_DATE),
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: delivery_staff
-- Information about delivery personnel
-- =========================================================
CREATE TABLE delivery_staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_number VARCHAR(20),
    license_number VARCHAR(50),
    zone VARCHAR(50),
    status ENUM('available', 'on_delivery', 'off_duty') DEFAULT 'available',
    hired_date DATE DEFAULT (CURRENT_DATE),
    total_deliveries INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: milk_products
-- Available milk products and variants
-- =========================================================
CREATE TABLE milk_products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    product_type ENUM('whole_milk', 'skim_milk', 'low_fat', 'organic', 'flavored') NOT NULL,
    description TEXT,
    unit_size DECIMAL(5, 2) NOT NULL COMMENT 'Size in liters',
    price_per_unit DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 50,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_type (product_type),
    INDEX idx_is_available (is_available)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: orders
-- Customer orders with status tracking
-- =========================================================
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_type ENUM('daily', 'weekly', 'monthly', 'one_time') NOT NULL,
    order_status ENUM('pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time_slot ENUM('morning', 'afternoon', 'evening') DEFAULT 'morning',
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_order_status (order_status),
    INDEX idx_delivery_date (delivery_date),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: order_items
-- Individual items within each order
-- =========================================================
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES milk_products(product_id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: deliveries
-- Delivery assignments and tracking
-- =========================================================
CREATE TABLE deliveries (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    staff_id INT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_delivery DATETIME NOT NULL,
    actual_delivery DATETIME,
    delivery_status ENUM('assigned', 'picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'assigned',
    delivery_notes TEXT,
    customer_signature BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES delivery_staff(staff_id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_delivery_status (delivery_status),
    INDEX idx_scheduled_delivery (scheduled_delivery)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: payments
-- Payment records for orders
-- =========================================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method ENUM('cash', 'mpesa', 'bank_transfer', 'card') NOT NULL,
    payment_reference VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB;

-- =========================================================
-- TABLE: recurring_orders
-- Template for recurring daily/weekly/monthly orders
-- =========================================================
CREATE TABLE recurring_orders (
    recurring_order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
    delivery_time_slot ENUM('morning', 'afternoon', 'evening') DEFAULT 'morning',
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    next_delivery_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES milk_products(product_id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_is_active (is_active),
    INDEX idx_next_delivery (next_delivery_date)
) ENGINE=InnoDB;

-- =========================================================
-- VIEW: sales_summary
-- Aggregated sales data for reporting
-- =========================================================
CREATE VIEW sales_summary AS
SELECT 
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(o.total_amount) AS total_revenue,
    COUNT(DISTINCT o.customer_id) AS unique_customers
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.order_status = 'delivered'
GROUP BY DATE(o.order_date);

-- =========================================================
-- VIEW: product_sales_summary
-- Sales breakdown by product
-- =========================================================
CREATE VIEW product_sales_summary AS
SELECT 
    mp.product_id,
    mp.product_name,
    mp.product_type,
    COUNT(DISTINCT oi.order_id) AS times_ordered,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.subtotal) AS total_revenue
FROM milk_products mp
LEFT JOIN order_items oi ON mp.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status = 'delivered'
GROUP BY mp.product_id, mp.product_name, mp.product_type;

-- =========================================================
-- VIEW: customer_sales_summary
-- Customer purchase history
-- =========================================================
CREATE VIEW customer_sales_summary AS
SELECT 
    c.customer_id,
    u.full_name,
    u.email,
    u.phone,
    c.customer_since,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_spent,
    MAX(o.order_date) AS last_order_date
FROM customers c
JOIN users u ON c.user_id = u.user_id
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_status = 'delivered'
GROUP BY c.customer_id, u.full_name, u.email, u.phone, c.customer_since;

-- =========================================================
-- VIEW: delivery_performance
-- Delivery staff performance metrics
-- =========================================================
CREATE VIEW delivery_performance AS
SELECT 
    ds.staff_id,
    u.full_name AS staff_name,
    ds.zone,
    COUNT(d.delivery_id) AS total_deliveries,
    SUM(CASE WHEN d.delivery_status = 'delivered' THEN 1 ELSE 0 END) AS successful_deliveries,
    SUM(CASE WHEN d.delivery_status = 'failed' THEN 1 ELSE 0 END) AS failed_deliveries,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, d.scheduled_delivery, d.actual_delivery)), 2) AS avg_delay_minutes
FROM delivery_staff ds
JOIN users u ON ds.user_id = u.user_id
LEFT JOIN deliveries d ON ds.staff_id = d.staff_id
GROUP BY ds.staff_id, u.full_name, ds.zone;

-- =========================================================
-- STORED PROCEDURE: Generate Daily Sales Report
-- =========================================================
DELIMITER //
CREATE PROCEDURE GetDailySalesReport(IN report_date DATE)
BEGIN
    SELECT 
        ss.sale_date,
        ss.total_orders,
        ss.total_quantity_sold,
        ss.total_revenue,
        ss.unique_customers
    FROM sales_summary ss
    WHERE ss.sale_date = report_date;
END //
DELIMITER ;

-- =========================================================
-- STORED PROCEDURE: Generate Sales Report by Date Range
-- =========================================================
DELIMITER //
CREATE PROCEDURE GetSalesReportByDateRange(
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    SELECT 
        DATE(o.order_date) AS sale_date,
        COUNT(DISTINCT o.order_id) AS total_orders,
        SUM(oi.quantity) AS total_quantity_sold,
        SUM(o.total_amount) AS total_revenue,
        COUNT(DISTINCT o.customer_id) AS unique_customers
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_status = 'delivered'
        AND DATE(o.order_date) BETWEEN start_date AND end_date
    GROUP BY DATE(o.order_date)
    ORDER BY sale_date;
END //
DELIMITER ;

-- =========================================================
-- Success message
-- =========================================================
SELECT 'Database schema created successfully!' AS Status;
