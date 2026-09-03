/**
 * Order Routes
 * /api/orders/*
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const OrderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

/**
 * @route   GET /api/orders
 * @desc    Get all orders (filtered by role)
 * @access  Private
 */
router.get('/', authenticateToken, OrderController.getAllOrders);

/**
 * @route   GET /api/orders/pending
 * @desc    Get pending orders
 * @access  Private (Admin only)
 */
router.get(
    '/pending',
    authenticateToken,
    authorizeRoles('admin'),
    OrderController.getPendingOrders
);

/**
 * @route   GET /api/orders/today
 * @desc    Get today's deliveries
 * @access  Private (Admin, Delivery Staff)
 */
router.get(
    '/today',
    authenticateToken,
    authorizeRoles('admin', 'delivery_staff'),
    OrderController.getTodaysDeliveries
);

/**
 * @route   GET /api/orders/statistics
 * @desc    Get order statistics
 * @access  Private (Admin only)
 */
router.get(
    '/statistics',
    authenticateToken,
    authorizeRoles('admin'),
    OrderController.getOrderStatistics
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, OrderController.getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post(
    '/',
    authenticateToken,
    [
        body('order_type').isIn(['daily', 'weekly', 'monthly', 'one_time'])
            .withMessage('Invalid order type'),
        body('delivery_address').trim().notEmpty().withMessage('Delivery address is required'),
        body('delivery_date').isISO8601().withMessage('Valid delivery date is required'),
        body('delivery_time_slot').optional().isIn(['morning', 'afternoon', 'evening'])
            .withMessage('Invalid time slot'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required')
    ],
    validate,
    OrderController.createOrder
);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin, Delivery Staff)
 */
router.put(
    '/:id/status',
    authenticateToken,
    authorizeRoles('admin', 'delivery_staff'),
    [
        body('status').isIn(['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'])
            .withMessage('Invalid status')
    ],
    validate,
    OrderController.updateOrderStatus
);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.put('/:id/cancel', authenticateToken, OrderController.cancelOrder);

module.exports = router;
