/**
 * Product Controller
 * Handles milk product management operations
 */

const ProductModel = require('../models/Product');

class ProductController {
    /**
     * Get all products
     */
    static async getAllProducts(req, res) {
        try {
            const { available_only } = req.query;
            const products = await ProductModel.findAll(available_only === 'true');

            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                error: error.message
            });
        }
    }

    /**
     * Get product by ID
     */
    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await ProductModel.findById(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product',
                error: error.message
            });
        }
    }

    /**
     * Create new product (Admin only)
     */
    static async createProduct(req, res) {
        try {
            const productData = req.body;
            const productId = await ProductModel.create(productData);

            const product = await ProductModel.findById(productId);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: error.message
            });
        }
    }

    /**
     * Update product (Admin only)
     */
    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            await ProductModel.update(id, updateData);
            const product = await ProductModel.findById(id);

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: product
            });
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error.message
            });
        }
    }

    /**
     * Delete product (Admin only)
     */
    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            await ProductModel.delete(id);

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error.message
            });
        }
    }

    /**
     * Get low stock products (Admin only)
     */
    static async getLowStockProducts(req, res) {
        try {
            const products = await ProductModel.getLowStockProducts();

            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (error) {
            console.error('Get low stock products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch low stock products',
                error: error.message
            });
        }
    }

    /**
     * Get product statistics (Admin only)
     */
    static async getProductStatistics(req, res) {
        try {
            const statistics = await ProductModel.getStatistics();

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            console.error('Get product statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product statistics',
                error: error.message
            });
        }
    }

    /**
     * Search products
     */
    static async searchProducts(req, res) {
        try {
            const { q } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const products = await ProductModel.search(q);

            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (error) {
            console.error('Search products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search products',
                error: error.message
            });
        }
    }
}

module.exports = ProductController;
