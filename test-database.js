// test-database.js
// Script to test database connection and verify tables

require('dotenv').config();
const db = require('./db');

console.log('🔍 Testing Database Connection...\n');

// Test 1: Check connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Connection test FAILED:', err.message);
        process.exit(1);
    }

    console.log('✅ Connection test PASSED\n');
    connection.release();

    // Test 2: Check tables
    console.log('📋 Checking database tables...\n');

    db.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('❌ Failed to fetch tables:', err.message);
            process.exit(1);
        }

        console.log('Tables found:');
        results.forEach((row, index) => {
            const tableName = Object.values(row)[0];
            console.log(`  ${index + 1}. ${tableName}`);
        });
        console.log('');

        // Test 3: Count records in each table
        const tables = ['users', 'products', 'cart', 'orders', 'order_items'];
        let completed = 0;

        console.log('📊 Record counts:\n');

        tables.forEach(table => {
            db.query(`SELECT COUNT(*) as count FROM ${table}`, (err, results) => {
                if (err) {
                    console.error(`❌ Error counting ${table}:`, err.message);
                } else {
                    const count = results[0].count;
                    console.log(`  ${table.padEnd(15)} : ${count} record(s)`);
                }

                completed++;
                if (completed === tables.length) {
                    console.log('\n✅ Database verification completed!\n');

                    // Test 4: Check if admin user exists
                    db.query('SELECT username, email, role FROM users WHERE role = "admin"', (err, results) => {
                        if (err) {
                            console.error('❌ Error checking admin user:', err.message);
                        } else if (results.length > 0) {
                            console.log('👤 Admin users found:');
                            results.forEach(admin => {
                                console.log(`   - ${admin.username} (${admin.email})`);
                            });
                        } else {
                            console.log('⚠️  No admin users found. Run setup-db script to create one.');
                        }
                        console.log('');
                        process.exit(0);
                    });
                }
            });
        });
    });
});
