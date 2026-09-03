/**
 * Report Model
 * Handles sales reports and analytics
 */

const { query } = require('../config/database');

class ReportModel {
    /**
     * Get daily sales report
     */
    static async getDailySalesReport(date) {
        const sql = `
      SELECT 
        DATE(o.order_date) as sale_date,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(o.total_amount) as total_revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        AVG(o.total_amount) as avg_order_value
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_status = 'delivered'
      AND DATE(o.order_date) = ?
      GROUP BY DATE(o.order_date)
    `;

        const results = await query(sql, [date]);
        return results[0] || {
            sale_date: date,
            total_orders: 0,
            total_quantity_sold: 0,
            total_revenue: 0,
            unique_customers: 0,
            avg_order_value: 0
        };
    }

    /**
     * Get sales report by date range
     */
    static async getSalesReportByDateRange(startDate, endDate) {
        const sql = `
      SELECT 
        DATE(o.order_date) as sale_date,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(o.total_amount) as total_revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        AVG(o.total_amount) as avg_order_value
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_status = 'delivered'
      AND DATE(o.order_date) BETWEEN ? AND ?
      GROUP BY DATE(o.order_date)
      ORDER BY sale_date DESC
    `;

        return await query(sql, [startDate, endDate]);
    }

    /**
     * Get weekly sales report
     */
    static async getWeeklySalesReport(year, week) {
        const sql = `
      SELECT 
        YEARWEEK(o.order_date) as week_number,
        WEEK(o.order_date) as week,
        YEAR(o.order_date) as year,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(o.total_amount) as total_revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_status = 'delivered'
      AND YEAR(o.order_date) = ?
      AND WEEK(o.order_date) = ?
      GROUP BY YEARWEEK(o.order_date), YEAR(o.order_date), WEEK(o.order_date)
    `;

        const results = await query(sql, [year, week]);
        return results[0];
    }

    /**
     * Get monthly sales report
     */
    static async getMonthlySalesReport(year, month) {
        const sql = `
      SELECT 
        YEAR(o.order_date) as year,
        MONTH(o.order_date) as month,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(o.total_amount) as total_revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        AVG(o.total_amount) as avg_order_value
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_status = 'delivered'
      AND YEAR(o.order_date) = ?
      AND MONTH(o.order_date) = ?
      GROUP BY YEAR(o.order_date), MONTH(o.order_date)
    `;

        const results = await query(sql, [year, month]);
        return results[0];
    }

    /**
     * Get product sales summary
     */
    static async getProductSalesReport(startDate = null, endDate = null) {
        let sql = `
      SELECT 
        mp.product_id,
        mp.product_name,
        mp.product_type,
        mp.unit_size,
        mp.price_per_unit,
        COUNT(DISTINCT oi.order_id) as times_ordered,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.unit_price) as avg_selling_price
      FROM milk_products mp
      LEFT JOIN order_items oi ON mp.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status = 'delivered'
    `;

        const params = [];

        if (startDate && endDate) {
            sql += ' WHERE DATE(o.order_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        sql += ' GROUP BY mp.product_id ORDER BY total_revenue DESC';

        return await query(sql, params);
    }

    /**
     * Get customer sales summary
     */
    static async getCustomerSalesReport(startDate = null, endDate = null) {
        let sql = `
      SELECT 
        c.customer_id,
        u.full_name,
        u.email,
        u.phone,
        c.city,
        c.customer_since,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as avg_order_value,
        MAX(o.order_date) as last_order_date
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_status = 'delivered'
    `;

        const params = [];

        if (startDate && endDate) {
            sql += ' WHERE DATE(o.order_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        sql += ' GROUP BY c.customer_id ORDER BY total_spent DESC';

        return await query(sql, params);
    }

    /**
     * Get top selling products
     */
    static async getTopSellingProducts(limit = 10, startDate = null, endDate = null) {
        let sql = `
      SELECT 
        mp.product_id,
        mp.product_name,
        mp.product_type,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
      FROM milk_products mp
      JOIN order_items oi ON mp.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status = 'delivered'
    `;

        const params = [];

        if (startDate && endDate) {
            sql += ' AND DATE(o.order_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        sql += ' GROUP BY mp.product_id ORDER BY total_sold DESC LIMIT ?';
        params.push(limit);

        return await query(sql, params);
    }

    /**
     * Get top customers
     */
    static async getTopCustomers(limit = 10, startDate = null, endDate = null) {
        let sql = `
      SELECT 
        c.customer_id,
        u.full_name,
        u.email,
        COUNT(o.order_id) as total_orders,
        SUM(o.total_amount) as total_spent
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      JOIN orders o ON c.customer_id = o.customer_id
      WHERE o.order_status = 'delivered'
    `;

        const params = [];

        if (startDate && endDate) {
            sql += ' AND DATE(o.order_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        sql += ' GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT ?';
        params.push(limit);

        return await query(sql, params);
    }

    /**
     * Get delivery performance report
     */
    static async getDeliveryPerformanceReport(startDate = null, endDate = null) {
        let sql = `
      SELECT 
        ds.staff_id,
        u.full_name as staff_name,
        ds.zone,
        ds.vehicle_number,
        COUNT(d.delivery_id) as total_deliveries,
        SUM(CASE WHEN d.delivery_status = 'delivered' THEN 1 ELSE 0 END) as successful_deliveries,
        SUM(CASE WHEN d.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed_deliveries,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, d.scheduled_delivery, d.actual_delivery)), 2) as avg_delay_minutes,
        SUM(o.total_amount) as total_value_delivered
      FROM delivery_staff ds
      JOIN users u ON ds.user_id = u.user_id
      LEFT JOIN deliveries d ON ds.staff_id = d.staff_id
      LEFT JOIN orders o ON d.order_id = o.order_id AND d.delivery_status = 'delivered'
    `;

        const params = [];

        if (startDate && endDate) {
            sql += ' WHERE DATE(d.scheduled_delivery) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        sql += ' GROUP BY ds.staff_id ORDER BY successful_deliveries DESC';

        return await query(sql, params);
    }

    /**
     * Get payment method breakdown
     */
    static async getPaymentMethodReport(startDate, endDate) {
        const sql = `
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_amount,
        AVG(CASE WHEN payment_status = 'completed' THEN amount ELSE NULL END) as avg_transaction
      FROM payments
      WHERE payment_date BETWEEN ? AND ?
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;

        return await query(sql, [startDate, endDate]);
    }

    /**
     * Get comprehensive dashboard summary
     */
    static async getDashboardSummary(startDate, endDate) {
        // Total revenue
        const revenueSql = `
      SELECT SUM(total_amount) as total_revenue
      FROM orders
      WHERE order_status = 'delivered'
      AND order_date BETWEEN ? AND ?
    `;

        // Order statistics
        const ordersSql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `;

        // Customer statistics
        const customersSql = `
      SELECT COUNT(DISTINCT customer_id) as total_customers
      FROM orders
      WHERE order_status = 'delivered'
      AND order_date BETWEEN ? AND ?
    `;

        // Product statistics
        const productsSql = `
      SELECT SUM(quantity) as total_products_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status = 'delivered'
      AND o.order_date BETWEEN ? AND ?
    `;

        const [revenue, orders, customers, products] = await Promise.all([
            query(revenueSql, [startDate, endDate]),
            query(ordersSql, [startDate, endDate]),
            query(customersSql, [startDate, endDate]),
            query(productsSql, [startDate, endDate])
        ]);

        return {
            total_revenue: revenue[0].total_revenue || 0,
            ...orders[0],
            total_customers: customers[0].total_customers || 0,
            total_products_sold: products[0].total_products_sold || 0
        };
    }
}

module.exports = ReportModel;
