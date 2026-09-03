/**
 * Product Routes
 * /api/products/*
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ProductController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', ProductController.getAllProducts);

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', ProductController.searchProducts);

/**
 * @route   GET /api/products/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin only)
 */
router.get(
    '/low-stock',
    authenticateToken,
    authorizeRoles('admin'),
    ProductController.getLowStockProducts
);

/**
 * @route   GET /api/products/statistics
 * @desc    Get product statistics
 * @access  Private (Admin only)
 */
router.get(
    '/statistics',
    authenticateToken,
    authorizeRoles('admin'),
    ProductController.getProductStatistics
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', ProductController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin only)
 */
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin'),
    [
        body('product_name').trim().notEmpty().withMessage('Product name is required'),
        body('product_type').isIn(['whole_milk', 'skim_milk', 'low_fat', 'organic', 'flavored'])
            .withMessage('Invalid product type'),
        body('unit_size').isFloat({ min: 0.1 }).withMessage('Valid unit size is required'),
        body('price_per_unit').isFloat({ min: 0 }).withMessage('Valid price is required'),
        body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer')
    ],
    validate,
    ProductController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 */
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    ProductController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    ProductController.deleteProduct
);

module.exports = router;
