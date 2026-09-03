/**
 * Delivery Model
 * Handles delivery tracking and management
 */

const { query } = require('../config/database');

class DeliveryModel {
    /**
     * Create a new delivery assignment
     */
    static async create(deliveryData) {
        const {
            order_id,
            staff_id,
            scheduled_delivery,
            delivery_notes
        } = deliveryData;

        const sql = `
      INSERT INTO deliveries (order_id, staff_id, scheduled_delivery, delivery_notes)
      VALUES (?, ?, ?, ?)
    `;

        const result = await query(sql, [
            order_id,
            staff_id,
            scheduled_delivery,
            delivery_notes || null
        ]);

        // Update order status to processing
        await query(
            'UPDATE orders SET order_status = ? WHERE order_id = ?',
            ['processing', order_id]
        );

        return result.insertId;
    }

    /**
     * Find delivery by ID
     */
    static async findById(deliveryId) {
        const sql = `
      SELECT d.*, 
             o.order_id, o.total_amount, o.delivery_address,
             c.customer_id,
             u_customer.full_name as customer_name,
             u_customer.phone as customer_phone,
             ds.staff_id,
             u_staff.full_name as staff_name,
             u_staff.phone as staff_phone,
             ds.vehicle_number
      FROM deliveries d
      JOIN orders o ON d.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u_customer ON c.user_id = u_customer.user_id
      LEFT JOIN delivery_staff ds ON d.staff_id = ds.staff_id
      LEFT JOIN users u_staff ON ds.user_id = u_staff.user_id
      WHERE d.delivery_id = ?
    `;

        const deliveries = await query(sql, [deliveryId]);
        return deliveries[0] || null;
    }

    /**
     * Get all deliveries with filters
     */
    static async findAll(filters = {}) {
        let sql = `
      SELECT d.*,
             o.order_id, o.total_amount, o.delivery_address,
             u_customer.full_name as customer_name,
             u_staff.full_name as staff_name,
             ds.vehicle_number
      FROM deliveries d
      JOIN orders o ON d.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u_customer ON c.user_id = u_customer.user_id
      LEFT JOIN delivery_staff ds ON d.staff_id = ds.staff_id
      LEFT JOIN users u_staff ON ds.user_id = u_staff.user_id
    `;

        const conditions = [];
        const params = [];

        if (filters.staff_id) {
            conditions.push('d.staff_id = ?');
            params.push(filters.staff_id);
        }

        if (filters.delivery_status) {
            conditions.push('d.delivery_status = ?');
            params.push(filters.delivery_status);
        }

        if (filters.scheduled_date) {
            conditions.push('DATE(d.scheduled_delivery) = ?');
            params.push(filters.scheduled_date);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY d.scheduled_delivery ASC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        return await query(sql, params);
    }

    /**
     * Update delivery status
     */
    static async updateStatus(deliveryId, newStatus, notes = null) {
        const validStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];

        if (!validStatuses.includes(newStatus)) {
            throw new Error('Invalid delivery status');
        }

        let sql = 'UPDATE deliveries SET delivery_status = ?';
        const params = [newStatus];

        // Set actual delivery time if delivered or failed
        if (newStatus === 'delivered' || newStatus === 'failed') {
            sql += ', actual_delivery = NOW()';
        }

        if (notes) {
            sql += ', delivery_notes = ?';
            params.push(notes);
        }

        sql += ' WHERE delivery_id = ?';
        params.push(deliveryId);

        await query(sql, params);

        // Update order status based on delivery status
        const delivery = await this.findById(deliveryId);
        if (delivery) {
            let orderStatus = 'processing';

            if (newStatus === 'in_transit') {
                orderStatus = 'out_for_delivery';
            } else if (newStatus === 'delivered') {
                orderStatus = 'delivered';
            }

            await query(
                'UPDATE orders SET order_status = ? WHERE order_id = ?',
                [orderStatus, delivery.order_id]
            );

            // Update delivery staff total deliveries if delivered
            if (newStatus === 'delivered' && delivery.staff_id) {
                await query(
                    'UPDATE delivery_staff SET total_deliveries = total_deliveries + 1 WHERE staff_id = ?',
                    [delivery.staff_id]
                );
            }
        }

        return true;
    }

    /**
     * Assign delivery to staff
     */
    static async assignToStaff(deliveryId, staffId) {
        const sql = 'UPDATE deliveries SET staff_id = ? WHERE delivery_id = ?';
        await query(sql, [staffId, deliveryId]);

        // Update staff status
        await query(
            'UPDATE delivery_staff SET status = ? WHERE staff_id = ?',
            ['on_delivery', staffId]
        );

        return true;
    }

    /**
     * Mark as delivered
     */
    static async markAsDelivered(deliveryId, customerSignature = false) {
        const sql = `
      UPDATE deliveries 
      SET delivery_status = 'delivered', 
          actual_delivery = NOW(),
          customer_signature = ?
      WHERE delivery_id = ?
    `;

        await query(sql, [customerSignature, deliveryId]);
        return await this.updateStatus(deliveryId, 'delivered');
    }

    /**
     * Get deliveries by staff
     */
    static async findByStaff(staffId, limit = 50) {
        return await this.findAll({ staff_id: staffId, limit });
    }

    /**
     * Get today's deliveries
     */
    static async getTodaysDeliveries() {
        const today = new Date().toISOString().split('T')[0];
        return await this.findAll({ scheduled_date: today });
    }

    /**
     * Get pending deliveries
     */
    static async getPendingDeliveries() {
        return await this.findAll({ delivery_status: 'assigned' });
    }

    /**
     * Get delivery statistics
     */
    static async getStatistics(startDate, endDate) {
        const sql = `
      SELECT 
        COUNT(*) as total_deliveries,
        SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as successful_deliveries,
        SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) as failed_deliveries,
        AVG(TIMESTAMPDIFF(MINUTE, scheduled_delivery, actual_delivery)) as avg_delay_minutes
      FROM deliveries
      WHERE scheduled_delivery BETWEEN ? AND ?
    `;

        const results = await query(sql, [startDate, endDate]);
        return results[0];
    }
}

module.exports = DeliveryModel;
