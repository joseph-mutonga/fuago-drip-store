/**
 * Product Model
 * Handles milk product-related database operations
 */

const { query } = require('../config/database');

class ProductModel {
    /**
     * Create a new product
     */
    static async create(productData) {
        const {
            product_name,
            product_type,
            description,
            unit_size,
            price_per_unit,
            stock_quantity,
            min_stock_level,
            is_available
        } = productData;

        const sql = `
      INSERT INTO milk_products 
      (product_name, product_type, description, unit_size, price_per_unit, 
       stock_quantity, min_stock_level, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const result = await query(sql, [
            product_name,
            product_type,
            description,
            unit_size,
            price_per_unit,
            stock_quantity || 0,
            min_stock_level || 50,
            is_available !== false
        ]);

        return result.insertId;
    }

    /**
     * Find product by ID
     */
    static async findById(productId) {
        const sql = 'SELECT * FROM milk_products WHERE product_id = ?';
        const products = await query(sql, [productId]);
        return products[0] || null;
    }

    /**
     * Get all products
     */
    static async findAll(availableOnly = false) {
        let sql = 'SELECT * FROM milk_products';

        if (availableOnly) {
            sql += ' WHERE is_available = TRUE';
        }

        sql += ' ORDER BY product_name';

        return await query(sql);
    }

    /**
     * Get products by type
     */
    static async findByType(productType) {
        const sql = `
      SELECT * FROM milk_products 
      WHERE product_type = ? AND is_available = TRUE
      ORDER BY price_per_unit
    `;
        return await query(sql, [productType]);
    }

    /**
     * Update product
     */
    static async update(productId, updateData) {
        const allowedFields = [
            'product_name',
            'product_type',
            'description',
            'unit_size',
            'price_per_unit',
            'stock_quantity',
            'min_stock_level',
            'is_available'
        ];

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(productId);
        const sql = `UPDATE milk_products SET ${fields.join(', ')} WHERE product_id = ?`;

        await query(sql, values);
        return true;
    }

    /**
     * Update stock quantity
     */
    static async updateStock(productId, quantity, operation = 'add') {
        const sql = operation === 'add'
            ? 'UPDATE milk_products SET stock_quantity = stock_quantity + ? WHERE product_id = ?'
            : 'UPDATE milk_products SET stock_quantity = stock_quantity - ? WHERE product_id = ?';

        await query(sql, [quantity, productId]);
        return true;
    }

    /**
     * Check if product has enough stock
     */
    static async checkStock(productId, requiredQuantity) {
        const product = await this.findById(productId);

        if (!product) {
            throw new Error('Product not found');
        }

        return product.stock_quantity >= requiredQuantity;
    }

    /**
     * Get low stock products
     */
    static async getLowStockProducts() {
        const sql = `
      SELECT * FROM milk_products 
      WHERE stock_quantity <= min_stock_level
      ORDER BY stock_quantity ASC
    `;
        return await query(sql);
    }

    /**
     * Delete product
     */
    static async delete(productId) {
        const sql = 'DELETE FROM milk_products WHERE product_id = ?';
        await query(sql, [productId]);
        return true;
    }

    /**
     * Make product unavailable (soft delete)
     */
    static async makeUnavailable(productId) {
        const sql = 'UPDATE milk_products SET is_available = FALSE WHERE product_id = ?';
        await query(sql, [productId]);
        return true;
    }

    /**
     * Get product statistics
     */
    static async getStatistics() {
        const sql = `
      SELECT 
        product_type,
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_stock,
        AVG(price_per_unit) as avg_price,
        SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count
      FROM milk_products
      WHERE is_available = TRUE
      GROUP BY product_type
    `;
        return await query(sql);
    }

    /**
     * Search products
     */
    static async search(searchTerm) {
        const sql = `
      SELECT * FROM milk_products
      WHERE (product_name LIKE ? OR description LIKE ?)
      AND is_available = TRUE
      ORDER BY product_name
      LIMIT 50
    `;
        const term = `%${searchTerm}%`;
        return await query(sql, [term, term]);
    }
}

module.exports = ProductModel;
