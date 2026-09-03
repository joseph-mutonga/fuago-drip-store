/**
 * Customer Model
 * Handles customer-related database operations
 */

const { query, transaction } = require('../config/database');

class CustomerModel {
    /**
     * Create customer profile (after user registration)
     */
    static async create(customerData) {
        const { user_id, address, city, postal_code, delivery_instructions } = customerData;

        const sql = `
      INSERT INTO customers (user_id, address, city, postal_code, delivery_instructions)
      VALUES (?, ?, ?, ?, ?)
    `;

        const result = await query(sql, [user_id, address, city, postal_code, delivery_instructions]);
        return result.insertId;
    }

    /**
     * Find customer by user ID
     */
    static async findByUserId(userId) {
        const sql = `
      SELECT c.*, u.email, u.full_name, u.phone, u.is_active
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.user_id = ?
    `;
        const customers = await query(sql, [userId]);
        return customers[0] || null;
    }

    /**
     * Find customer by customer ID
     */
    static async findById(customerId) {
        const sql = `
      SELECT c.*, u.email, u.full_name, u.phone, u.is_active
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.customer_id = ?
    `;
        const customers = await query(sql, [customerId]);
        return customers[0] || null;
    }

    /**
     * Get all customers
     */
    static async findAll(limit = 100, offset = 0) {
        const sql = `
      SELECT c.*, u.email, u.full_name, u.phone, u.is_active
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      ORDER BY c.customer_since DESC
      LIMIT ? OFFSET ?
    `;
        return await query(sql, [limit, offset]);
    }

    /**
     * Update customer information
     */
    static async update(customerId, updateData) {
        const allowedFields = ['address', 'city', 'postal_code', 'delivery_instructions'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(customerId);
        const sql = `UPDATE customers SET ${fields.join(', ')} WHERE customer_id = ?`;

        await query(sql, values);
        return true;
    }

    /**
     * Get customer order history
     */
    static async getOrderHistory(customerId, limit = 50) {
        const sql = `
      SELECT o.*, 
             COUNT(oi.order_item_id) as item_count,
             p.payment_status,
             p.payment_method
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE o.customer_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
      LIMIT ?
    `;
        return await query(sql, [customerId, limit]);
    }

    /**
     * Update customer statistics
     */
    static async updateStatistics(customerId) {
        const sql = `
      UPDATE customers 
      SET 
        total_orders = (
          SELECT COUNT(*) FROM orders 
          WHERE customer_id = ? AND order_status = 'delivered'
        ),
        total_spent = (
          SELECT COALESCE(SUM(total_amount), 0) FROM orders 
          WHERE customer_id = ? AND order_status = 'delivered'
        )
      WHERE customer_id = ?
    `;
        await query(sql, [customerId, customerId, customerId]);
        return true;
    }

    /**
     * Get customer statistics summary
     */
    static async getStatistics(customerId) {
        const sql = `
      SELECT 
        customer_id,
        total_orders,
        total_spent,
        customer_since,
        (SELECT COUNT(*) FROM recurring_orders 
         WHERE customer_id = ? AND is_active = TRUE) as active_subscriptions,
        (SELECT COUNT(*) FROM orders 
         WHERE customer_id = ? AND order_status = 'pending') as pending_orders
      FROM customers
      WHERE customer_id = ?
    `;
        const results = await query(sql, [customerId, customerId, customerId]);
        return results[0] || null;
    }

    /**
     * Search customers by name, email, or phone
     */
    static async search(searchTerm) {
        const sql = `
      SELECT c.*, u.email, u.full_name, u.phone
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?
      ORDER BY u.full_name
      LIMIT 50
    `;
        const term = `%${searchTerm}%`;
        return await query(sql, [term, term, term]);
    }
}

module.exports = CustomerModel;
