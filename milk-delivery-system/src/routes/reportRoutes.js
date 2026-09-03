/**
 * Report Routes
 * /api/reports/*
 */

const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get dashboard summary
 * @access  Private (Admin only)
 */
router.get(
    '/dashboard',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getDashboardSummary
);

/**
 * @route   GET /api/reports/sales/daily
 * @desc    Get daily sales report
 * @access  Private (Admin only)
 */
router.get(
    '/sales/daily',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getDailySalesReport
);

/**
 * @route   GET /api/reports/sales/range
 * @desc    Get sales report by date range
 * @access  Private (Admin only)
 */
router.get(
    '/sales/range',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getSalesReportByDateRange
);

/**
 * @route   GET /api/reports/sales/monthly
 * @desc    Get monthly sales report
 * @access  Private (Admin only)
 */
router.get(
    '/sales/monthly',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getMonthlySalesReport
);

/**
 * @route   GET /api/reports/products
 * @desc    Get product sales report
 * @access  Private (Admin only)
 */
router.get(
    '/products',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getProductSalesReport
);

/**
 * @route   GET /api/reports/customers
 * @desc    Get customer sales report
 * @access  Private (Admin only)
 */
router.get(
    '/customers',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getCustomerSalesReport
);

/**
 * @route   GET /api/reports/top-products
 * @desc    Get top selling products
 * @access  Private (Admin only)
 */
router.get(
    '/top-products',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getTopSellingProducts
);

/**
 * @route   GET /api/reports/top-customers
 * @desc    Get top customers
 * @access  Private (Admin only)
 */
router.get(
    '/top-customers',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getTopCustomers
);

/**
 * @route   GET /api/reports/delivery-performance
 * @desc    Get delivery performance report
 * @access  Private (Admin only)
 */
router.get(
    '/delivery-performance',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getDeliveryPerformanceReport
);

/**
 * @route   GET /api/reports/payment-methods
 * @desc    Get payment method report
 * @access  Private (Admin only)
 */
router.get(
    '/payment-methods',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.getPaymentMethodReport
);

/**
 * @route   GET /api/reports/export
 * @desc    Export report to CSV
 * @access  Private (Admin only)
 */
router.get(
    '/export',
    authenticateToken,
    authorizeRoles('admin'),
    ReportController.exportToCSV
);

module.exports = router;
