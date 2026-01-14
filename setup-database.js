// setup-database.js
// This script will set up the database schema for the e-commerce application

require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting database setup...\n');

// Create connection without database selection
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        console.error('\nPlease ensure:');
        console.error('1. MySQL Community Server is running');
        console.error('2. Your credentials in .env file are correct');
        console.error('3. You have proper permissions\n');
        process.exit(1);
    }

    console.log('✅ Connected to MySQL server\n');

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
        console.error(`❌ Schema file not found at: ${schemaPath}`);
        process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing database schema...\n');

    connection.query(schema, (err, results) => {
        if (err) {
            console.error('❌ Error executing schema:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log('✅ Database schema executed successfully!\n');

        // Display results
        console.log('📊 Database Setup Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Database Name: ${process.env.DB_NAME || 'image_upload_db'}`);
        console.log('Tables Created:');
        console.log('  ✓ users');
        console.log('  ✓ products');
        console.log('  ✓ cart');
        console.log('  ✓ orders');
        console.log('  ✓ order_items');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🔐 Default Admin Credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Database setup completed successfully!');
        console.log('You can now start your server with: npm run dev\n');

        connection.end();
    });
});
