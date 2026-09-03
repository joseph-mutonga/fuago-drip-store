-- =========================================================
-- SAMPLE DATA FOR MILK DELIVERY MANAGEMENT SYSTEM
-- =========================================================

USE milk_delivery_db;

-- =========================================================
-- Insert Admin User (Password: admin123)
-- =========================================================
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES
('admin@milkdelivery.com', '$2a$10$YourHashedPasswordHere', 'admin', 'System Administrator', '+254700000000');

-- =========================================================
-- Insert Sample Delivery Staff
-- =========================================================
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES
('john.doe@milkdelivery.com', '$2a$10$YourHashedPasswordHere', 'delivery_staff', 'John Doe', '+254701111111'),
('jane.smith@milkdelivery.com', '$2a$10$YourHashedPasswordHere', 'delivery_staff', 'Jane Smith', '+254702222222');

INSERT INTO delivery_staff (user_id, vehicle_number, license_number, zone, status) VALUES
(2, 'KCA 123X', 'DL12345', 'North Zone', 'available'),
(3, 'KCB 456Y', 'DL67890', 'South Zone', 'available');

-- =========================================================
-- Insert Sample Customers
-- =========================================================
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES
('customer1@example.com', '$2a$10$YourHashedPasswordHere', 'customer', 'Alice Johnson', '+254703333333'),
('customer2@example.com', '$2a$10$YourHashedPasswordHere', 'customer', 'Bob Williams', '+254704444444'),
('customer3@example.com', '$2a$10$YourHashedPasswordHere', 'customer', 'Carol Martinez', '+254705555555'),
('customer4@example.com', '$2a$10$YourHashedPasswordHere', 'customer', 'David Brown', '+254706666666'),
('customer5@example.com', '$2a$10$YourHashedPasswordHere', 'customer', 'Emma Davis', '+254707777777');

INSERT INTO customers (user_id, address, city, postal_code, delivery_instructions) VALUES
(4, '123 Main Street, Apt 4B', 'Nairobi', '00100', 'Leave at front door'),
(5, '456 Oak Avenue', 'Mombasa', '80100', 'Ring doorbell'),
(6, '789 Pine Road', 'Kisumu', '40100', 'Call upon arrival'),
(7, '321 Maple Lane', 'Nakuru', '20100', 'Gate code: 1234'),
(8, '654 Cedar Boulevard', 'Eldoret', '30100', 'Deliver to back entrance');

-- =========================================================
-- Insert Milk Products
-- =========================================================
INSERT INTO milk_products (product_name, product_type, description, unit_size, price_per_unit, stock_quantity, min_stock_level, is_available) VALUES
('Fresh Whole Milk 500ml', 'whole_milk', 'Farm fresh whole milk in 500ml bottles', 0.5, 60.00, 500, 100, TRUE),
('Fresh Whole Milk 1L', 'whole_milk', 'Farm fresh whole milk in 1 liter bottles', 1.0, 110.00, 800, 150, TRUE),
('Low Fat Milk 500ml', 'low_fat', 'Healthy low-fat milk in 500ml bottles', 0.5, 65.00, 400, 80, TRUE),
('Low Fat Milk 1L', 'low_fat', 'Healthy low-fat milk in 1 liter bottles', 1.0, 120.00, 600, 120, TRUE),
('Skim Milk 500ml', 'skim_milk', 'Zero fat skim milk in 500ml bottles', 0.5, 70.00, 300, 60, TRUE),
('Skim Milk 1L', 'skim_milk', 'Zero fat skim milk in 1 liter bottles', 1.0, 130.00, 450, 90, TRUE),
('Organic Whole Milk 1L', 'organic', 'Premium organic whole milk', 1.0, 180.00, 200, 40, TRUE),
('Chocolate Flavored Milk 500ml', 'flavored', 'Delicious chocolate milk for kids', 0.5, 85.00, 350, 70, TRUE),
('Strawberry Flavored Milk 500ml', 'flavored', 'Sweet strawberry flavored milk', 0.5, 85.00, 300, 60, TRUE);

-- =========================================================
-- Insert Sample Orders
-- =========================================================
INSERT INTO orders (customer_id, order_type, order_status, total_amount, delivery_address, delivery_date, delivery_time_slot, special_instructions) VALUES
(1, 'weekly', 'delivered', 220.00, '123 Main Street, Apt 4B, Nairobi', '2026-01-10', 'morning', 'Please deliver early'),
(1, 'daily', 'delivered', 110.00, '123 Main Street, Apt 4B, Nairobi', '2026-01-11', 'morning', NULL),
(2, 'one_time', 'delivered', 240.00, '456 Oak Avenue, Mombasa', '2026-01-12', 'afternoon', NULL),
(3, 'monthly', 'delivered', 1100.00, '789 Pine Road, Kisumu', '2026-01-09', 'morning', 'Call before delivery'),
(4, 'weekly', 'processing', 340.00, '321 Maple Lane, Nakuru', '2026-01-17', 'morning', NULL),
(5, 'daily', 'pending', 180.00, '654 Cedar Boulevard, Eldoret', '2026-01-18', 'evening', NULL);

-- =========================================================
-- Insert Order Items
-- =========================================================
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
-- Order 1
(1, 2, 2, 110.00, 220.00),
-- Order 2
(2, 2, 1, 110.00, 110.00),
-- Order 3
(3, 4, 2, 120.00, 240.00),
-- Order 4
(4, 2, 10, 110.00, 1100.00),
-- Order 5
(5, 5, 2, 70.00, 140.00),
(5, 8, 2, 85.00, 170.00),
-- Order 6
(6, 7, 1, 180.00, 180.00);

-- =========================================================
-- Insert Deliveries
-- =========================================================
INSERT INTO deliveries (order_id, staff_id, scheduled_delivery, actual_delivery, delivery_status, delivery_notes, customer_signature) VALUES
(1, 1, '2026-01-10 07:00:00', '2026-01-10 07:15:00', 'delivered', 'Delivered successfully', TRUE),
(2, 1, '2026-01-11 07:00:00', '2026-01-11 07:10:00', 'delivered', 'Delivered successfully', TRUE),
(3, 2, '2026-01-12 14:00:00', '2026-01-12 14:20:00', 'delivered', 'Customer was home', TRUE),
(4, 1, '2026-01-09 07:00:00', '2026-01-09 07:05:00', 'delivered', 'Monthly order delivered', TRUE),
(5, 1, '2026-01-17 07:00:00', NULL, 'assigned', 'Scheduled for delivery', FALSE),
(6, 2, '2026-01-18 18:00:00', NULL, 'assigned', 'Evening delivery scheduled', FALSE);

-- =========================================================
-- Insert Payments
-- =========================================================
INSERT INTO payments (order_id, payment_method, payment_reference, amount, payment_status, payment_date, notes) VALUES
(1, 'mpesa', 'MPESA123456', 220.00, 'completed', '2026-01-10 07:20:00', 'Payment received via M-Pesa'),
(2, 'cash', NULL, 110.00, 'completed', '2026-01-11 07:15:00', 'Cash on delivery'),
(3, 'mpesa', 'MPESA789012', 240.00, 'completed', '2026-01-12 14:25:00', 'M-Pesa payment confirmed'),
(4, 'bank_transfer', 'BANK345678', 1100.00, 'completed', '2026-01-09 08:00:00', 'Bank transfer verified'),
(5, 'cash', NULL, 340.00, 'pending', NULL, 'Payment on delivery'),
(6, 'mpesa', NULL, 180.00, 'pending', NULL, 'Awaiting payment');

-- =========================================================
-- Insert Recurring Orders
-- =========================================================
INSERT INTO recurring_orders (customer_id, product_id, quantity, frequency, delivery_time_slot, start_date, end_date, is_active, next_delivery_date) VALUES
(1, 2, 1, 'daily', 'morning', '2026-01-01', NULL, TRUE, '2026-01-17'),
(2, 4, 2, 'weekly', 'afternoon', '2026-01-01', '2026-03-31', TRUE, '2026-01-19'),
(3, 2, 5, 'weekly', 'morning', '2026-01-01', NULL, TRUE, '2026-01-20'),
(4, 7, 2, 'monthly', 'morning', '2026-01-01', NULL, TRUE, '2026-02-01');

-- =========================================================
-- Update customer statistics
-- =========================================================
UPDATE customers c
SET 
    total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = c.customer_id AND order_status = 'delivered'),
    total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.customer_id AND order_status = 'delivered');

-- =========================================================
-- Update delivery staff statistics
-- =========================================================
UPDATE delivery_staff ds
SET 
    total_deliveries = (SELECT COUNT(*) FROM deliveries WHERE staff_id = ds.staff_id AND delivery_status = 'delivered');

-- =========================================================
-- Success message
-- =========================================================
SELECT 'Sample data inserted successfully!' AS Status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_customers FROM customers;
SELECT COUNT(*) AS total_products FROM milk_products;
SELECT COUNT(*) AS total_orders FROM orders;
