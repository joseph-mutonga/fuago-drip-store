// database/migrate_laptops.js
require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'image_upload_db',
  multipleStatements: true
});

connection.connect(async (err) => {
  if (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL image_upload_db');

  // Check columns in products
  connection.query('SHOW COLUMNS FROM products', async (err, columns) => {
    if (err) {
      console.error('❌ Error reading columns:', err);
      process.exit(1);
    }

    const colNames = columns.map(c => c.Field);
    const alterStatements = [];

    if (!colNames.includes('brand')) {
      alterStatements.push('ADD COLUMN brand VARCHAR(100) DEFAULT NULL');
    }
    if (!colNames.includes('category')) {
      alterStatements.push('ADD COLUMN category VARCHAR(100) DEFAULT "Ultrabook"');
    }
    if (!colNames.includes('processor')) {
      alterStatements.push('ADD COLUMN processor VARCHAR(150) DEFAULT NULL');
    }
    if (!colNames.includes('ram')) {
      alterStatements.push('ADD COLUMN ram VARCHAR(50) DEFAULT NULL');
    }
    if (!colNames.includes('storage')) {
      alterStatements.push('ADD COLUMN storage VARCHAR(50) DEFAULT NULL');
    }
    if (!colNames.includes('gpu')) {
      alterStatements.push('ADD COLUMN gpu VARCHAR(150) DEFAULT NULL');
    }
    if (!colNames.includes('screen_size')) {
      alterStatements.push('ADD COLUMN screen_size VARCHAR(50) DEFAULT NULL');
    }

    const runAlter = () => {
      return new Promise((resolve, reject) => {
        if (alterStatements.length === 0) {
          console.log('ℹ️ All laptop spec columns already exist in products table.');
          return resolve();
        }
        const sql = `ALTER TABLE products ${alterStatements.join(', ')}`;
        connection.query(sql, (err) => {
          if (err) reject(err);
          else {
            console.log('✅ Added laptop specification columns to products table.');
            resolve();
          }
        });
      });
    };

    try {
      await runAlter();

      // Seed curated laptop catalog
      console.log('🌱 Seeding laptop catalog...');

      const laptops = [
        {
          name: 'Apple MacBook Pro 16" M3 Max',
          description: 'The ultimate powerhouse for creators and power users. Liquid Retina XDR display with ProMotion 120Hz, 14-core CPU, 30-core GPU, studio-quality mics, and up to 22 hours of battery life in Space Black aluminum.',
          price: 3499.00,
          quantity: 15,
          image: '/uploads/macbook-pro-16.jpg',
          brand: 'Apple',
          category: 'Ultrabook',
          processor: 'Apple M3 Max (14-Core CPU)',
          ram: '36GB Unified Memory',
          storage: '1TB Superfast NVMe SSD',
          gpu: 'Apple 30-Core GPU',
          screen_size: '16.2" Liquid Retina XDR (120Hz)'
        },
        {
          name: 'ASUS ROG Zephyrus G16 Gaming Laptop',
          description: 'Next-level ultra-slim gaming laptop engineered with a 240Hz ROG Nebula OLED display, RGB per-key keyboard, dual vapor-chamber cooling, and extreme RTX 4080 desktop-class gaming muscle in Eclipse Gray.',
          price: 2699.99,
          quantity: 12,
          image: '/uploads/gaming-rog-zephyrus.jpg',
          brand: 'ASUS',
          category: 'Gaming',
          processor: 'Intel Core i9-14900HX (24-Core)',
          ram: '32GB DDR5 5600MHz',
          storage: '1TB PCIe 4.0 NVMe SSD',
          gpu: 'NVIDIA GeForce RTX 4080 12GB',
          screen_size: '16.0" 2.5K OLED 240Hz'
        },
        {
          name: 'Dell XPS 15 InfinityEdge OLED',
          description: 'Precision-crafted from machined aluminum and carbon fiber palm rest. Featuring a breathtaking 3.5K OLED touch display, premium Waves Nx 3D audio, and discrete NVIDIA RTX 4060 graphics for creative mastery.',
          price: 2199.00,
          quantity: 14,
          image: '/uploads/dell-xps-15.jpg',
          brand: 'Dell',
          category: 'Ultrabook',
          processor: 'Intel Core i7-13700H (14-Core)',
          ram: '32GB DDR5 4800MHz',
          storage: '1TB M.2 PCIe NVMe SSD',
          gpu: 'NVIDIA GeForce RTX 4060 8GB',
          screen_size: '15.6" 3.5K OLED Touch (400 nits)'
        },
        {
          name: 'Lenovo ThinkPad X1 Carbon Gen 12',
          description: 'The definitive enterprise business laptop. Ultralight carbon fiber construction, legendary spill-resistant ergonomic keyboard with TrackPoint, AI-powered Intel Core Ultra 7, and military-grade MIL-STD 810H durability.',
          price: 1899.00,
          quantity: 20,
          image: '/uploads/lenovo-thinkpad-x1.jpg',
          brand: 'Lenovo',
          category: 'Business',
          processor: 'Intel Core Ultra 7 155H (16-Core)',
          ram: '32GB LPDDR5X 7500MHz',
          storage: '1TB PCIe Gen 4 Performance SSD',
          gpu: 'Intel Arc Graphics with AI NPU',
          screen_size: '14.0" 2.8K OLED (100% DCI-P3)'
        },
        {
          name: 'HP Spectre x360 2-in-1 OLED',
          description: 'Versatile 360-degree convertible luxury laptop with gem-cut brass accents. Includes HP Rechargeable MPP2.0 Tilt Pen, 9MP AI camera with night mode, and vibrant 3K2K OLED touch display with 17-hour battery.',
          price: 1399.99,
          quantity: 18,
          image: '/uploads/hp-spectre-x360.jpg',
          brand: 'HP',
          category: 'Ultrabook',
          processor: 'Intel Core i7-1355U (10-Core)',
          ram: '16GB LPDDR5 6400MHz',
          storage: '512GB PCIe NVMe M.2 SSD',
          gpu: 'Intel Iris Xe Graphics',
          screen_size: '14.0" 3K2K OLED Touch'
        },
        {
          name: 'Acer Aspire 5 Slim Student Edition',
          description: 'Exceptional everyday computing and multitasking value. Features an all-day battery, crisp Full HD anti-glare screen, fast Wi-Fi 6E connectivity, and aluminum top cover designed for students and professionals alike.',
          price: 549.99,
          quantity: 25,
          image: '/uploads/acer-aspire-5.jpg',
          brand: 'Acer',
          category: 'Student',
          processor: 'AMD Ryzen 5 7520U (4-Core / 8-Thread)',
          ram: '16GB LPDDR5 RAM',
          storage: '512GB PCIe NVMe SSD',
          gpu: 'AMD Radeon 610M Graphics',
          screen_size: '15.6" Full HD IPS Narrow Bezel'
        },
        {
          name: 'Lenovo Legion Pro 5i Gaming Beast',
          description: 'Built for esports and competitive dominance. Armed with Coldfront 5.0 hybrid thermals, pure gaming power with RTX 4070, and TrueStrike RGB keyboard with 100% anti-ghosting.',
          price: 1699.99,
          quantity: 10,
          image: '/uploads/gaming-rog-zephyrus.jpg',
          brand: 'Lenovo',
          category: 'Gaming',
          processor: 'Intel Core i7-14700HX (20-Core)',
          ram: '32GB DDR5 5600MHz',
          storage: '1TB M.2 NVMe SSD',
          gpu: 'NVIDIA GeForce RTX 4070 8GB GDDR6',
          screen_size: '16.0" WQXGA 240Hz IPS (500 nits)'
        },
        {
          name: 'Apple MacBook Air 15" M3',
          description: 'Impossibly thin at 11.5mm, yet remarkably fast. Powered by Apple M3 with 18 hours of silent battery life, 6-speaker sound system with Spatial Audio, MagSafe charging, and 500-nit Liquid Retina display.',
          price: 1499.00,
          quantity: 16,
          image: '/uploads/macbook-pro-16.jpg',
          brand: 'Apple',
          category: 'Ultrabook',
          processor: 'Apple M3 (8-Core CPU)',
          ram: '16GB Unified Memory',
          storage: '512GB Superfast SSD',
          gpu: 'Apple 10-Core GPU',
          screen_size: '15.3" Liquid Retina True Tone'
        }
      ];

      for (const laptop of laptops) {
        // Check if laptop with same name exists
        const checkSql = 'SELECT id FROM products WHERE name = ?';
        const [existing] = await connection.promise().query(checkSql, [laptop.name]);

        let productId;
        if (existing.length > 0) {
          productId = existing[0].id;
          const updateSql = `
            UPDATE products 
            SET description=?, price=?, quantity=?, image=?, brand=?, category=?, processor=?, ram=?, storage=?, gpu=?, screen_size=?
            WHERE id=?
          `;
          await connection.promise().query(updateSql, [
            laptop.description, laptop.price, laptop.quantity, laptop.image,
            laptop.brand, laptop.category, laptop.processor, laptop.ram, laptop.storage, laptop.gpu, laptop.screen_size,
            productId
          ]);
          console.log(`🔄 Updated laptop: ${laptop.name} (ID: ${productId})`);
        } else {
          const insertSql = `
            INSERT INTO products (name, description, price, quantity, image, brand, category, processor, ram, storage, gpu, screen_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const [res] = await connection.promise().query(insertSql, [
            laptop.name, laptop.description, laptop.price, laptop.quantity, laptop.image,
            laptop.brand, laptop.category, laptop.processor, laptop.ram, laptop.storage, laptop.gpu, laptop.screen_size
          ]);
          productId = res.insertId;
          console.log(`✨ Inserted laptop: ${laptop.name} (ID: ${productId})`);
        }

        // Also add secondary image to product_images for slider preview
        const checkImagesSql = 'SELECT id FROM product_images WHERE product_id = ?';
        const [imgs] = await connection.promise().query(checkImagesSql, [productId]);
        if (imgs.length === 0) {
          await connection.promise().query(
            'INSERT INTO product_images (product_id, image_path) VALUES (?, ?)',
            [productId, laptop.image]
          );
        }
      }

      console.log('\n🎉 Laptop migration and seeding completed successfully!');
      connection.end();
    } catch (e) {
      console.error('❌ Migration failed:', e);
      connection.end();
      process.exit(1);
    }
  });
});
