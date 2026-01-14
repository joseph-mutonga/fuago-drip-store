// add-admin-and-fix-images.js
// Script to add new admin user and fix product images

require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

console.log('🔧 Updating database...\n');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'image_upload_db'
});

connection.connect(async (err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        process.exit(1);
    }

    console.log('✅ Connected to MySQL\n');

    try {
        // 1. Hash password for new admin
        const hashedPassword = await bcrypt.hash('admin', 10);

        console.log('📝 Adding new admin user...');

        // 2. Insert new admin (or update if exists)
        const insertAdminQuery = `
      INSERT INTO users (username, email, password, role) 
      VALUES ('Admin', 'admin@gmail.com', ?, 'admin')
      ON DUPLICATE KEY UPDATE 
        password = ?, 
        role = 'admin',
        username = 'Admin'
    `;

        connection.query(insertAdminQuery, [hashedPassword, hashedPassword], (err, result) => {
            if (err) {
                console.error('❌ Error adding admin:', err.message);
            } else {
                console.log('✅ Admin user added/updated successfully');
                console.log('   Email: admin@gmail.com');
                console.log('   Password: admin\n');
            }

            // 3. Update product images
            console.log('🖼️  Updating product images...');

            const updateImagesQuery = `
        UPDATE products 
        SET image = CASE id
          WHEN 1 THEN '/uploads/sample1.jpg'
          WHEN 2 THEN '/uploads/sample2.jpg'
          WHEN 3 THEN '/uploads/sample3.jpg'
          ELSE image
        END
        WHERE id IN (1, 2, 3)
      `;

            connection.query(updateImagesQuery, (err, result) => {
                if (err) {
                    console.error('❌ Error updating images:', err.message);
                } else {
                    console.log(`✅ Updated ${result.affectedRows} product image(s)\n`);
                }

                // 4. Display current admins
                console.log('👤 Current admin users:');
                connection.query(
                    'SELECT id, username, email, role FROM users WHERE role = "admin"',
                    (err, admins) => {
                        if (err) {
                            console.error('❌ Error fetching admins:', err.message);
                        } else {
                            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                            admins.forEach(admin => {
                                console.log(`  ID: ${admin.id} | ${admin.username} (${admin.email})`);
                            });
                            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                        }

                        // 5. Display products with images
                        console.log('📦 Products with images:');
                        connection.query(
                            'SELECT id, name, image FROM products ORDER BY id',
                            (err, products) => {
                                if (err) {
                                    console.error('❌ Error fetching products:', err.message);
                                } else {
                                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                                    products.forEach(prod => {
                                        console.log(`  ${prod.id}. ${prod.name}`);
                                        console.log(`     Image: ${prod.image || 'No image'}`);
                                    });
                                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                                }

                                console.log('✅ All updates completed successfully!\n');
                                console.log('🎯 Admin Login Credentials:');
                                console.log('   Email: admin@gmail.com');
                                console.log('   Password: admin\n');
                                console.log('🎯 Admin Capabilities:');
                                console.log('   ✓ Add new products');
                                console.log('   ✓ Edit existing products');
                                console.log('   ✓ Delete products');
                                console.log('   ✓ View all orders');
                                console.log('   ✓ Track customer orders');
                                console.log('   ✓ Manage users\n');

                                connection.end();
                            }
                        );
                    }
                );
            });
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        connection.end();
        process.exit(1);
    }
});
