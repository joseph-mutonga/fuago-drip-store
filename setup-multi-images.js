// setup-multi-images.js
require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'image_upload_db'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ DB connection failed:', err);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL');

    // 1. Create product_images table
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      image_path VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `;

    connection.query(createTableQuery, (err) => {
        if (err) {
            console.error('❌ Error creating table:', err);
            process.exit(1);
        }
        console.log('✅ table "product_images" created or exists');

        // 2. Migrate existing images
        const migrateQuery = `
      INSERT INTO product_images (product_id, image_path)
      SELECT id, image FROM products
      WHERE image IS NOT NULL AND image != ''
      AND id NOT IN (SELECT DISTINCT product_id FROM product_images)
    `;

        connection.query(migrateQuery, (err, result) => {
            if (err) {
                console.error('❌ Error migrating images:', err);
            } else {
                console.log(`✅ Migrated ${result.affectedRows} existing images to new table`);
            }

            console.log('🎉 Setup complete!');
            connection.end();
        });
    });
});
