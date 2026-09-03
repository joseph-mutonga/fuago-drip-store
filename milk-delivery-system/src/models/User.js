/**
 * User Model
 * Handles all user-related database operations
 */

const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
    /**
     * Create a new user
     */
    static async create(userData) {
        const { email, password, role, full_name, phone } = userData;

        // Hash password
        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const sql = `
      INSERT INTO users (email, password_hash, role, full_name, phone)
      VALUES (?, ?, ?, ?, ?)
    `;

        const result = await query(sql, [email, password_hash, role, full_name, phone]);
        return result.insertId;
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const users = await query(sql, [email]);
        return users[0] || null;
    }

    /**
     * Find user by ID
     */
    static async findById(userId) {
        const sql = 'SELECT user_id, email, role, full_name, phone, is_active, created_at FROM users WHERE user_id = ?';
        const users = await query(sql, [userId]);
        return users[0] || null;
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Update user
     */
    static async update(userId, updateData) {
        const allowedFields = ['full_name', 'phone', 'is_active'];
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

        values.push(userId);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;

        await query(sql, values);
        return true;
    }

    /**
     * Change password
     */
    static async changePassword(userId, newPassword) {
        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);

        const sql = 'UPDATE users SET password_hash = ? WHERE user_id = ?';
        await query(sql, [password_hash, userId]);
        return true;
    }

    /**
     * Get all users by role
     */
    static async findByRole(role) {
        const sql = `
      SELECT user_id, email, role, full_name, phone, is_active, created_at 
      FROM users 
      WHERE role = ?
      ORDER BY created_at DESC
    `;
        return await query(sql, [role]);
    }

    /**
     * Deactivate user
     */
    static async deactivate(userId) {
        const sql = 'UPDATE users SET is_active = FALSE WHERE user_id = ?';
        await query(sql, [userId]);
        return true;
    }

    /**
     * Activate user
     */
    static async activate(userId) {
        const sql = 'UPDATE users SET is_active = TRUE WHERE user_id = ?';
        await query(sql, [userId]);
        return true;
    }

    /**
     * Delete user (soft delete by deactivating)
     */
    static async delete(userId) {
        return await this.deactivate(userId);
    }

    /**
     * Get user statistics
     */
    static async getStatistics() {
        const sql = `
      SELECT 
        role,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count
      FROM users
      GROUP BY role
    `;
        return await query(sql);
    }
}

module.exports = UserModel;
