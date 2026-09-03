/**
 * Order Model
 * Handles order-related database operations
 */

const { query, transaction } = require('../config/database');
const ProductModel = require('./Product');

class OrderModel {
    /**
     * Create a new order with items (transaction)
     */
    static async create(orderData) {
        const {
            customer_id,
            order_type,
            delivery_address,
            delivery_date,
            delivery_time_slot,
            special_instructions,
            items // Array of { product_id, quantity }
        } = orderData;

        return await transaction(async (connection) => {
            // Calculate total amount and prepare order items
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                const [products] = await connection.execute(
                    'SELECT product_id, price_per_unit, stock_quantity FROM milk_products WHERE product_id = ?',
                    [item.product_id]
                );

                if (products.length === 0) {
                    throw new Error(`Product ${item.product_id} not found`);
                }

                const product = products[0];

                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.product_id}`);
                }

                const subtotal = product.price_per_unit * item.quantity;
                totalAmount += subtotal;

                orderItems.push({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: product.price_per_unit,
                    subtotal: subtotal
                });

                // Reduce stock
                await connection.execute(
                    'UPDATE milk_products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Create order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders 
         (customer_id, order_type, total_amount, delivery_address, delivery_date, 
          delivery_time_slot, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    customer_id,
                    order_type,
                    totalAmount,
                    delivery_address,
                    delivery_date,
                    delivery_time_slot || 'morning',
                    special_instructions
                ]
            );

            const orderId = orderResult.insertId;

            // Create order items
            for (const item of orderItems) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
                );
            }

            return {
                order_id: orderId,
                total_amount: totalAmount,
                item_count: orderItems.length
            };
        });
    }

    /**
     * Find order by ID with items
     */
    static async findById(orderId) {
        const orderSql = `
      SELECT o.*, c.customer_id, u.full_name as customer_name, u.email, u.phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE o.order_id = ?
    `;

        const itemsSql = `
      SELECT oi.*, mp.product_name, mp.product_type, mp.unit_size
      FROM order_items oi
      JOIN milk_products mp ON oi.product_id = mp.product_id
      WHERE oi.order_id = ?
    `;

        const orders = await query(orderSql, [orderId]);

        if (orders.length === 0) {
            return null;
        }

        const order = orders[0];
        const items = await query(itemsSql, [orderId]);

        return {
            ...order,
            items
        };
    }

    /**
     * Get all orders with filters
     */
    static async findAll(filters = {}) {
        let sql = `
      SELECT o.*, 
             c.customer_id,
             u.full_name as customer_name,
             u.phone as customer_phone,
             COUNT(oi.order_item_id) as item_count
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
    `;

        const conditions = [];
        const params = [];

        if (filters.customer_id) {
            conditions.push('o.customer_id = ?');
            params.push(filters.customer_id);
        }

        if (filters.order_status) {
            conditions.push('o.order_status = ?');
            params.push(filters.order_status);
        }

        if (filters.order_type) {
            conditions.push('o.order_type = ?');
            params.push(filters.order_type);
        }

        if (filters.delivery_date) {
            conditions.push('DATE(o.delivery_date) = ?');
            params.push(filters.delivery_date);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY o.order_id ORDER BY o.order_date DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        return await query(sql, params);
    }

    /**
     * Update order status
     */
    static async updateStatus(orderId, newStatus) {
        const validStatuses = ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];

        if (!validStatuses.includes(newStatus)) {
            throw new Error('Invalid order status');
        }

        const sql = 'UPDATE orders SET order_status = ? WHERE order_id = ?';
        await query(sql, [newStatus, orderId]);

        // If order is cancelled, restore stock
        if (newStatus === 'cancelled') {
            await this.restoreStock(orderId);
        }

        // If order is delivered, update customer statistics
        if (newStatus === 'delivered') {
            const order = await this.findById(orderId);
            if (order) {
                const CustomerModel = require('./Customer');
                await CustomerModel.updateStatistics(order.customer_id);
            }
        }

        return true;
    }

    /**
     * Restore stock when order is cancelled
     */
    static async restoreStock(orderId) {
        const items = await query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
            [orderId]
        );

        for (const item of items) {
            await ProductModel.updateStock(item.product_id, item.quantity, 'add');
        }

        return true;
    }

    /**
     * Cancel order
     */
    static async cancel(orderId) {
        return await this.updateStatus(orderId, 'cancelled');
    }

    /**
     * Get orders by customer
     */
    static async findByCustomer(customerId, limit = 50) {
        return await this.findAll({ customer_id: customerId, limit });
    }

    /**
     * Get orders by status
     */
    static async findByStatus(status, limit = 100) {
        return await this.findAll({ order_status: status, limit });
    }

    /**
     * Get pending orders
     */
    static async getPendingOrders() {
        return await this.findByStatus('pending');
    }

    /**
     * Get today's deliveries
     */
    static async getTodaysDeliveries() {
        const today = new Date().toISOString().split('T')[0];
        return await this.findAll({ delivery_date: today });
    }

    /**
     * Get order statistics
     */
    static async getStatistics(startDate, endDate) {
        const sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN order_status = 'delivered' THEN total_amount ELSE NULL END) as avg_order_value
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `;

        const results = await query(sql, [startDate, endDate]);
        return results[0];
    }
}

module.exports = OrderModel;
