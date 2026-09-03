/**
 * Delivery Controller
 * Handles delivery assignment and tracking operations
 */

const DeliveryModel = require('../models/Delivery');

class DeliveryController {
    /**
     * Create a new delivery assignment
     */
    static async createDelivery(req, res) {
        try {
            const deliveryData = req.body;
            const deliveryId = await DeliveryModel.create(deliveryData);

            const delivery = await DeliveryModel.findById(deliveryId);

            res.status(201).json({
                success: true,
                message: 'Delivery assigned successfully',
                data: delivery
            });
        } catch (error) {
            console.error('Create delivery error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create delivery',
                error: error.message
            });
        }
    }

    /**
     * Get all deliveries with filters
     */
    static async getAllDeliveries(req, res) {
        try {
            const filters = {};

            // For delivery staff, only show their own deliveries
            if (req.user.role === 'delivery_staff') {
                const staffSql = 'SELECT staff_id FROM delivery_staff WHERE user_id = ?';
                const { query } = require('../config/database');
                const staffResults = await query(staffSql, [req.user.user_id]);

                if (staffResults.length > 0) {
                    filters.staff_id = staffResults[0].staff_id;
                }
            }

            // Apply query filters
            if (req.query.status) filters.delivery_status = req.query.status;
            if (req.query.scheduled_date) filters.scheduled_date = req.query.scheduled_date;
            if (req.query.limit) filters.limit = req.query.limit;

            const deliveries = await DeliveryModel.findAll(filters);

            res.json({
                success: true,
                count: deliveries.length,
                data: deliveries
            });
        } catch (error) {
            console.error('Get deliveries error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deliveries',
                error: error.message
            });
        }
    }

    /**
     * Get delivery by ID
     */
    static async getDeliveryById(req, res) {
        try {
            const { id } = req.params;
            const delivery = await DeliveryModel.findById(id);

            if (!delivery) {
                return res.status(404).json({
                    success: false,
                    message: 'Delivery not found'
                });
            }

            res.json({
                success: true,
                data: delivery
            });
        } catch (error) {
            console.error('Get delivery error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch delivery',
                error: error.message
            });
        }
    }

    /**
     * Update delivery status
     */
    static async updateDeliveryStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            await DeliveryModel.updateStatus(id, status, notes);

            const delivery = await DeliveryModel.findById(id);

            res.json({
                success: true,
                message: 'Delivery status updated successfully',
                data: delivery
            });
        } catch (error) {
            console.error('Update delivery status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update delivery status',
                error: error.message
            });
        }
    }

    /**
     * Assign delivery to staff
     */
    static async assignDelivery(req, res) {
        try {
            const { id } = req.params;
            const { staff_id } = req.body;

            await DeliveryModel.assignToStaff(id, staff_id);

            const delivery = await DeliveryModel.findById(id);

            res.json({
                success: true,
                message: 'Delivery assigned to staff successfully',
                data: delivery
            });
        } catch (error) {
            console.error('Assign delivery error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign delivery',
                error: error.message
            });
        }
    }

    /**
     * Mark delivery as delivered
     */
    static async markAsDelivered(req, res) {
        try {
            const { id } = req.params;
            const { customer_signature } = req.body;

            await DeliveryModel.markAsDelivered(id, customer_signature === true);

            const delivery = await DeliveryModel.findById(id);

            res.json({
                success: true,
                message: 'Delivery marked as delivered',
                data: delivery
            });
        } catch (error) {
            console.error('Mark as delivered error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark delivery as delivered',
                error: error.message
            });
        }
    }

    /**
     * Get today's deliveries
     */
    static async getTodaysDeliveries(req, res) {
        try {
            const deliveries = await DeliveryModel.getTodaysDeliveries();

            res.json({
                success: true,
                count: deliveries.length,
                data: deliveries
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
     * Get pending deliveries
     */
    static async getPendingDeliveries(req, res) {
        try {
            const deliveries = await DeliveryModel.getPendingDeliveries();

            res.json({
                success: true,
                count: deliveries.length,
                data: deliveries
            });
        } catch (error) {
            console.error('Get pending deliveries error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending deliveries',
                error: error.message
            });
        }
    }

    /**
     * Get delivery statistics
     */
    static async getDeliveryStatistics(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'start_date and end_date are required'
                });
            }

            const statistics = await DeliveryModel.getStatistics(start_date, end_date);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            console.error('Get delivery statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch delivery statistics',
                error: error.message
            });
        }
    }
}

module.exports = DeliveryController;
