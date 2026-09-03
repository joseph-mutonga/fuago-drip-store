/**
 * Database Seeding Script
 * Run this script to populate the database with sample data
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function seedDatabase() {
    let connection;

    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Database Seeding - Sample Data');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Connect to database
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'milk_delivery_db',
            multipleStatements: true
        });
        console.log('✓ Connected to database\n');

        // Hash passwords
        console.log('Generating secure passwords...');
        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
        const adminPassword = await bcrypt.hash('admin123', saltRounds);
        const staffPassword = await bcrypt.hash('staff123', saltRounds);
        const customerPassword = await bcrypt.hash('customer123', saltRounds);
        console.log('✓ Passwords hashed\n');

        // Insert admin user
        console.log('Creating admin user...');
        await connection.execute(
            `INSERT INTO users (email, password_hash, role, full_name, phone) 
       VALUES (?, ?, 'admin', 'System Administrator', '+254700000000')`,
            ['admin@milkdelivery.com', adminPassword]
        );
        console.log('✓ Admin user created (email: admin@milkdelivery.com, password: admin123)\n');

        // Insert delivery staff
        console.log('Creating delivery staff...');
        const [staff1] = await connection.execute(
            `INSERT INTO users (email, password_hash, role, full_name, phone) 
       VALUES (?, ?, 'delivery_staff', 'John Doe', '+254701111111')`,
            ['john.doe@milkdelivery.com', staffPassword]
        );

        const [staff2] = await connection.execute(
            `INSERT INTO users (email, password_hash, role, full_name, phone) 
       VALUES (?, ?, 'delivery_staff', 'Jane Smith', '+254702222222')`,
            ['jane.smith@milkdelivery.com', staffPassword]
        );

        await connection.execute(
            `INSERT INTO delivery_staff (user_id, vehicle_number, license_number, zone, status) 
       VALUES (?, 'KCA 123X', 'DL12345', 'North Zone', 'available')`,
            [staff1.insertId]
        );

        await connection.execute(
            `INSERT INTO delivery_staff (user_id, vehicle_number, license_number, zone, status) 
       VALUES (?, 'KCB 456Y', 'DL67890', 'South Zone', 'available')`,
            [staff2.insertId]
        );
        console.log('✓ Delivery staff created\n');

        // Insert sample customers
        console.log('Creating sample customers...');
        const customerNames = [
            { name: 'Alice Johnson', email: 'alice@example.com', phone: '+254703333333', address: '123 Main Street, Apt 4B', city: 'Nairobi', postal: '00100' },
            { name: 'Bob Williams', email: 'bob@example.com', phone: '+254704444444', address: '456 Oak Avenue', city: 'Mombasa', postal: '80100' },
            { name: 'Carol Martinez', email: 'carol@example.com', phone: '+254705555555', address: '789 Pine Road', city: 'Kisumu', postal: '40100' },
            { name: 'David Brown', email: 'david@example.com', phone: '+254706666666', address: '321 Maple Lane', city: 'Nakuru', postal: '20100' },
            { name: 'Emma Davis', email: 'emma@example.com', phone: '+254707777777', address: '654 Cedar Boulevard', city: 'Eldoret', postal: '30100' }
        ];

        for (const customer of customerNames) {
            const [userResult] = await connection.execute(
                `INSERT INTO users (email, password_hash, role, full_name, phone) 
         VALUES (?, ?, 'customer', ?, ?)`,
                [customer.email, customerPassword, customer.name, customer.phone]
            );

            await connection.execute(
                `INSERT INTO customers (user_id, address, city, postal_code, delivery_instructions) 
         VALUES (?, ?, ?, ?, 'Leave at front door')`,
                [userResult.insertId, customer.address, customer.city, customer.postal]
            );
        }
        console.log('✓ Sample customers created (password: customer123)\n');

        // Read and execute sample data SQL
        console.log('Inserting milk products and sample orders...');
        const sampleDataPath = path.join(__dirname, '..', 'database', 'sample-data.sql');
        let sampleData = await fs.readFile(sampleDataPath, 'utf8');

        // Remove user-related inserts from sample data (we've already done them with hashed passwords)
        sampleData = sampleData.replace(/INSERT INTO users[\s\S]*?;/gi, '');
        sampleData = sampleData.replace(/INSERT INTO customers[\s\S]*?;/gi, '');
        sampleData = sampleData.replace(/INSERT INTO delivery_staff[\s\S]*?;/gi, '');

        await connection.query(sampleData);
        console.log('✓ Products and sample data inserted\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Database Seeding Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nTest Accounts:');
        console.log('  Admin:');
        console.log('    Email: admin@milkdelivery.com');
        console.log('    Password: admin123');
        console.log('\n  Delivery Staff:');
        console.log('    Email: john.doe@milkdelivery.com');
        console.log('    Password: staff123');
        console.log('\n  Customer:');
        console.log('    Email: alice@example.com');
        console.log('    Password: customer123');
        console.log('\nNext Step:');
        console.log('  Start server: npm start\n');

    } catch (error) {
        console.error('\n✗ Database seeding failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run seeding
seedDatabase();
