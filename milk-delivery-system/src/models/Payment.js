/**
 * Payment Model
 * Handles payment recording and tracking
 */

const { query } = require('../config/database');

class PaymentModel {
    /**
     * Record a new payment
     */
    static async create(paymentData) {
        const {
            order_id,
            payment_method,
            payment_reference,
            amount,
            notes
        } = paymentData;

        const sql = `
      INSERT INTO payments (order_id, payment_method, payment_reference, amount, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

        const result = await query(sql, [
            order_id,
            payment_method,
            payment_reference || null,
            amount,
            notes || null
        ]);

        return result.insertId;
    }

    /**
     * Find payment by ID
     */
    static async findById(paymentId) {
        const sql = `
      SELECT p.*, 
             o.order_id, o.total_amount as order_total,
             c.customer_id,
             u.full_name as customer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE p.payment_id = ?
    `;

        const payments = await query(sql, [paymentId]);
        return payments[0] || null;
    }

    /**
     * Find payment by order ID
     */
    static async findByOrderId(orderId) {
        const sql = 'SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC';
        const payments = await query(sql, [orderId]);
        return payments[0] || null;
    }

    /**
     * Get all payments with filters
     */
    static async findAll(filters = {}) {
        let sql = `
      SELECT p.*,
             o.order_id, o.total_amount as order_total,
             u.full_name as customer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
    `;

        const conditions = [];
        const params = [];

        if (filters.payment_status) {
            conditions.push('p.payment_status = ?');
            params.push(filters.payment_status);
        }

        if (filters.payment_method) {
            conditions.push('p.payment_method = ?');
            params.push(filters.payment_method);
        }

        if (filters.start_date && filters.end_date) {
            conditions.push('DATE(p.payment_date) BETWEEN ? AND ?');
            params.push(filters.start_date, filters.end_date);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY p.payment_date DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        return await query(sql, params);
    }

    /**
     * Update payment status
     */
    static async updateStatus(paymentId, newStatus, notes = null) {
        const validStatuses = ['pending', 'completed', 'failed', 'refunded'];

        if (!validStatuses.includes(newStatus)) {
            throw new Error('Invalid payment status');
        }

        let sql = 'UPDATE payments SET payment_status = ?';
        const params = [newStatus];

        if (notes) {
            sql += ', notes = ?';
            params.push(notes);
        }

        sql += ' WHERE payment_id = ?';
        params.push(paymentId);

        await query(sql, params);
        return true;
    }

    /**
     * Confirm payment
     */
    static async confirmPayment(paymentId, paymentReference = null) {
        let sql = 'UPDATE payments SET payment_status = ?';
        const params = ['completed'];

        if (paymentReference) {
            sql += ', payment_reference = ?';
            params.push(paymentReference);
        }

        sql += ' WHERE payment_id = ?';
        params.push(paymentId);

        await query(sql, params);
        return true;
    }

    /**
     * Get pending payments
     */
    static async getPendingPayments() {
        return await this.findAll({ payment_status: 'pending' });
    }

    /**
     * Get payments by method
     */
    static async findByMethod(paymentMethod, limit = 100) {
        return await this.findAll({ payment_method: paymentMethod, limit });
    }

    /**
     * Get payment statistics
     */
    static async getStatistics(startDate, endDate) {
        const sql = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        payment_method,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as method_total
      FROM payments
      WHERE payment_date BETWEEN ? AND ?
      GROUP BY payment_method
    `;

        return await query(sql, [startDate, endDate]);
    }

    /**
     * Get total revenue
     */
    static async getTotalRevenue(startDate, endDate) {
        const sql = `
      SELECT SUM(amount) as total_revenue
      FROM payments
      WHERE payment_status = 'completed'
      AND payment_date BETWEEN ? AND ?
    `;

        const results = await query(sql, [startDate, endDate]);
        return results[0].total_revenue || 0;
    }
}

module.exports = PaymentModel;
