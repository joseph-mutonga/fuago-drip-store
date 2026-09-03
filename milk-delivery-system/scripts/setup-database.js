/**
 * Database Setup Script
 * Run this script to create the database schema
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    let connection;

    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Database Setup - Milk Delivery Management System');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Connect to MySQL server (without database)
        console.log('Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });
        console.log('✓ Connected to MySQL server\n');

        // Read schema file
        console.log('Reading database schema...');
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        console.log('✓ Schema file loaded\n');

        // Execute schema
        console.log('Creating database and tables...');
        await connection.query(schema);
        console.log('✓ Database schema created successfully\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Database Setup Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nNext Steps:');
        console.log('  1. Run seed script: npm run seed-db');
        console.log('  2. Start server: npm start\n');

    } catch (error) {
        console.error('\n✗ Database setup failed:');
        console.error(error.message);
        console.error('\nPlease check:');
        console.error('  - MySQL server is running');
        console.error('  - .env file has correct database credentials');
        console.error('  - User has necessary permissions\n');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup
setupDatabase();
