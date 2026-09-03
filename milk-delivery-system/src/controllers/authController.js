/**
 * Authentication Controller
 * Handles user registration, login, and token management
 */

const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const CustomerModel = require('../models/Customer');

class AuthController {
    /**
     * Register a new user (customer)
     */
    static async register(req, res) {
        try {
            const {
                email,
                password,
                full_name,
                phone,
                address,
                city,
                postal_code,
                delivery_instructions
            } = req.body;

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Create user account
            const userId = await UserModel.create({
                email,
                password,
                role: 'customer',
                full_name,
                phone
            });

            // Create customer profile
            await CustomerModel.create({
                user_id: userId,
                address,
                city,
                postal_code: postal_code || null,
                delivery_instructions: delivery_instructions || null
            });

            // Generate JWT token
            const token = jwt.sign(
                { user_id: userId, email, role: 'customer' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    user_id: userId,
                    email,
                    full_name,
                    role: 'customer',
                    token
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    }

    /**
     * User login
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                });
            }

            // Verify password
            const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user_id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(req, res) {
        try {
            const user = await UserModel.findById(req.user.user_id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // If customer, get customer details
            let profile = { ...user };

            if (user.role === 'customer') {
                const customer = await CustomerModel.findByUserId(user.user_id);
                if (customer) {
                    profile = { ...profile, ...customer };
                }
            }

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile',
                error: error.message
            });
        }
    }

    /**
     * Change password
     */
    static async changePassword(req, res) {
        try {
            const { current_password, new_password } = req.body;

            // Get user
            const user = await UserModel.findByEmail(req.user.email);

            // Verify current password
            const isPasswordValid = await UserModel.verifyPassword(current_password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            await UserModel.changePassword(req.user.user_id, new_password);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password',
                error: error.message
            });
        }
    }

    /**
     * Logout (client-side only - invalidate token)
     */
    static async logout(req, res) {
        res.json({
            success: true,
            message: 'Logout successful. Please remove the token from client storage.'
        });
    }
}

module.exports = AuthController;
