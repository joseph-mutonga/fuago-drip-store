/**
 * Delivery Routes
 * /api/deliveries/*
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const DeliveryController = require('../controllers/deliveryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

/**
 * @route   GET /api/deliveries
 * @desc    Get all deliveries (filtered by role)
 * @access  Private
 */
router.get('/', authenticateToken, DeliveryController.getAllDeliveries);

/**
 * @route   GET /api/deliveries/today
 * @desc    Get today's deliveries
 * @access  Private (Admin, Delivery Staff)
 */
router.get(
    '/today',
    authenticateToken,
    authorizeRoles('admin', 'delivery_staff'),
    DeliveryController.getTodaysDeliveries
);

/**
 * @route   GET /api/deliveries/pending
 * @desc    Get pending deliveries
 * @access  Private (Admin, Delivery Staff)
 */
router.get(
    '/pending',
    authenticateToken,
    authorizeRoles('admin', 'delivery_staff'),
    DeliveryController.getPendingDeliveries
);

/**
 * @route   GET /api/deliveries/statistics
 * @desc    Get delivery statistics
 * @access  Private (Admin only)
 */
router.get(
    '/statistics',
    authenticateToken,
    authorizeRoles('admin'),
    DeliveryController.getDeliveryStatistics
);

/**
 * @route   GET /api/deliveries/:id
 * @desc    Get delivery by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, DeliveryController.getDeliveryById);

/**
 * @route   POST /api/deliveries
 * @desc    Create new delivery assignment
 * @access  Private (Admin only)
 */
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin'),
    [
        body('order_id').isInt({ min: 1 }).withMessage('Valid order ID is required'),
        body('staff_id').optional().isInt({ min: 1 }).withMessage('Valid staff ID is required'),
        body('scheduled_delivery').isISO8601().withMessage('Valid scheduled delivery time is required')
    ],
    validate,
    DeliveryController.createDelivery
);

/**
 * @route   PUT /api/deliveries/:id/status
 * @desc    Update delivery status
 * @access  Private (Admin, Delivery Staff)
 */
router.put(
    '/:id/status',
    authenticateToken,
    authorizeRoles('admin', 'delivery_staff'),
    [
        body('status').isIn(['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'])
            .withMessage('Invalid status')
    ],
    validate,
    DeliveryController.updateDeliveryStatus
);

/**
 * @route   PUT /api/deliveries/:id/assign
 * @desc    Assign delivery to staff
 * @access  Private (Admin only)
 */
router.put(
    '/:id/assign',
    authenticateToken,
    authorizeRoles('admin'),
    [
        body('staff_id').isInt({ min: 1 }).withMessage('Valid staff ID is required')
    ],
    validate,
    DeliveryController.assignDelivery
);

/**
 * @route   PUT /api/deliveries/:id/delivered
 * @desc    Mark delivery as delivered
 * @access  Private (Admin, Delivery Staff)
 */
router.put(
    '/:id/delivered',
    authenticateToken,
    authorizeRoles('admin', 'delivery_staff'),
    DeliveryController.markAsDelivered
);

module.exports = router;
