/**
 * Order Controller
 * Handles order management operations
 */

const OrderModel = require('../models/Order');
const CustomerModel = require('../models/Customer');

class OrderController {
    /**
     * Create a new order
     */
    static async createOrder(req, res) {
        try {
            const orderData = req.body;

            // For customers, ensure they can only create orders for themselves
            if (req.user.role === 'customer') {
                const customer = await CustomerModel.findByUserId(req.user.user_id);
                if (!customer) {
                    return res.status(404).json({
                        success: false,
                        message: 'Customer profile not found'
                    });
                }
                orderData.customer_id = customer.customer_id;
            }

            const result = await OrderModel.create(orderData);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: result
            });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: error.message
            });
        }
    }

    /**
     * Get all orders with filters
     */
    static async getAllOrders(req, res) {
        try {
            const filters = {};

            // For customers, only show their own orders
            if (req.user.role === 'customer') {
                const customer = await CustomerModel.findByUserId(req.user.user_id);
                filters.customer_id = customer?.customer_id;
            }

            // Apply query filters
            if (req.query.status) filters.order_status = req.query.status;
            if (req.query.type) filters.order_type = req.query.type;
            if (req.query.delivery_date) filters.delivery_date = req.query.delivery_date;
            if (req.query.limit) filters.limit = req.query.limit;

            const orders = await OrderModel.findAll(filters);

            res.json({
                success: true,
                count: orders.length,
                data: orders
            });
        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    }

    /**
     * Get order by ID
     */
    static async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const order = await OrderModel.findById(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // For customers, ensure they can only view their own orders
            if (req.user.role === 'customer') {
                const customer = await CustomerModel.findByUserId(req.user.user_id);
                if (order.customer_id !== customer.customer_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied'
                    });
                }
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            console.error('Get order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order',
                error: error.message
            });
        }
    }

    /**
     * Update order status
     */
    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await OrderModel.updateStatus(id, status);

            const order = await OrderModel.findById(id);

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    }

    /**
     * Cancel order
     */
    static async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const order = await OrderModel.findById(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // For customers, ensure they can only cancel their own orders
            if (req.user.role === 'customer') {
                const customer = await CustomerModel.findByUserId(req.user.user_id);
                if (order.customer_id !== customer.customer_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied'
                    });
                }
            }

            // Only pending or processing orders can be cancelled
            if (!['pending', 'processing'].includes(order.order_status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Only pending or processing orders can be cancelled'
                });
            }

            await OrderModel.cancel(id);

            res.json({
                success: true,
                message: 'Order cancelled successfully'
            });
        } catch (error) {
            console.error('Cancel order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order',
                error: error.message
            });
        }
    }

    /**
     * Get pending orders (Admin only)
     */
    static async getPendingOrders(req, res) {
        try {
            const orders = await OrderModel.getPendingOrders();

            res.json({
                success: true,
                count: orders.length,
                data: orders
            });
        } catch (error) {
            console.error('Get pending orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending orders',
                error: error.message
            });
        }
    }

    /**
     * Get today's deliveries
     */
    static async getTodaysDeliveries(req, res) {
        try {
            const orders = await OrderModel.getTodaysDeliveries();

            res.json({
                success: true,
                count: orders.length,
                data: orders
            });
        } catch (error) {
            console.error('Get today\'s deliveries error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch today\'s deliveries',
                error: error.message
            });
        }
    }

    /**
     * Get order statistics
     */
    static async getOrderStatistics(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'start_date and end_date are required'
                });
            }

            const statistics = await OrderModel.getStatistics(start_date, end_date);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            console.error('Get order statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order statistics',
                error: error.message
            });
        }
    }
}

module.exports = OrderController;
