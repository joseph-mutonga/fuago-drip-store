const express = require("express");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const adminRoutes = require("./routes/adminRoutes");


const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const db = require("./db");

const app = express();



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/reports", require("./routes/reportRoutes"));


// -------------------- UPLOAD PRODUCT (LAPTOP) --------------------
app.post("/upload", upload.array("images", 5), (req, res) => {
  const { name, description, price, quantity, brand, category, processor, ram, storage, gpu, screen_size } = req.body;
  // Fallback to storing the first image in the legacy 'image' column for backward compatibility
  const primaryImage = req.files && req.files.length > 0 ? `/uploads/${req.files[0].filename}` : "";

  const sql = `
    INSERT INTO products (name, description, price, quantity, image, brand, category, processor, ram, storage, gpu, screen_size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    name,
    description,
    price,
    quantity,
    primaryImage,
    brand || null,
    category || 'Ultrabook',
    processor || null,
    ram || null,
    storage || null,
    gpu || null,
    screen_size || null
  ], (err, result) => {
    if (err) return res.status(500).send(err);

    const productId = result.insertId;

    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => [productId, `/uploads/${file.filename}`]);
      const imgSql = "INSERT INTO product_images (product_id, image_path) VALUES ?";
      db.query(imgSql, [imageValues], (err2) => {
        if (err2) console.error("Error saving additional images:", err2);
        res.redirect("/admin-dashboard.html");
      });
    } else {
      res.redirect("/admin-dashboard.html");
    }
  });
});

// -------------------- GET ALL PRODUCTS WITH FILTERING --------------------
app.get("/products", (req, res) => {
  const { brand, category, ram, storage, minPrice, maxPrice, search, sort } = req.query;
  const whereClauses = [];
  const params = [];

  if (brand && brand !== 'all') {
    const brands = brand.split(",").map(b => b.trim()).filter(Boolean);
    if (brands.length > 0) {
      whereClauses.push(`p.brand IN (${brands.map(() => "?").join(",")})`);
      params.push(...brands);
    }
  }

  if (category && category !== 'all' && category !== 'All') {
    const cats = category.split(",").map(c => c.trim()).filter(Boolean);
    if (cats.length > 0) {
      whereClauses.push(`p.category IN (${cats.map(() => "?").join(",")})`);
      params.push(...cats);
    }
  }

  if (ram && ram !== 'all') {
    const rams = ram.split(",").map(r => r.trim()).filter(Boolean);
    if (rams.length > 0) {
      const ramConditions = rams.map(() => "p.ram LIKE ?").join(" OR ");
      whereClauses.push(`(${ramConditions})`);
      params.push(...rams.map(r => `%${r}%`));
    }
  }

  if (storage && storage !== 'all') {
    const storages = storage.split(",").map(s => s.trim()).filter(Boolean);
    if (storages.length > 0) {
      const storageConditions = storages.map(() => "p.storage LIKE ?").join(" OR ");
      whereClauses.push(`(${storageConditions})`);
      params.push(...storages.map(s => `%${s}%`));
    }
  }

  if (minPrice && !isNaN(minPrice)) {
    whereClauses.push("p.price >= ?");
    params.push(parseFloat(minPrice));
  }

  if (maxPrice && !isNaN(maxPrice)) {
    whereClauses.push("p.price <= ?");
    params.push(parseFloat(maxPrice));
  }

  if (search && search.trim()) {
    whereClauses.push("(p.name LIKE ? OR p.brand LIKE ? OR p.processor LIKE ? OR p.description LIKE ? OR p.category LIKE ?)");
    const s = `%${search.trim()}%`;
    params.push(s, s, s, s, s);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  let orderSql = "ORDER BY p.id DESC";
  if (sort === "price_asc") orderSql = "ORDER BY p.price ASC";
  else if (sort === "price_desc") orderSql = "ORDER BY p.price DESC";
  else if (sort === "name_asc") orderSql = "ORDER BY p.name ASC";
  else if (sort === "newest") orderSql = "ORDER BY p.id DESC";

  const query = `
    SELECT p.*, GROUP_CONCAT(pi.image_path) as all_images
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    ${whereSql}
    GROUP BY p.id
    ${orderSql}
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send(err);
    }
    // Convert comma-separated images string to array
    const products = results.map(p => ({
      ...p,
      images: p.all_images ? p.all_images.split(',') : (p.image ? [p.image] : [])
    }));
    res.json(products);
  });
});

// -------------------- DELETE PRODUCT --------------------
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  // Get all images (from both legacy column and new table)
  const query = `
    SELECT image FROM products WHERE id = ?
    UNION
    SELECT image_path AS image FROM product_images WHERE product_id = ?
  `;

  db.query(query, [id, id], (err, results) => {
    if (err) return res.status(500).send(err);

    // Delete files
    results.forEach(row => {
      if (row.image) {
        const imagePath = path.join(__dirname, row.image);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) console.error("❌ Error deleting image file:", err);
          });
        }
      }
    });

    // Delete record (Cascade will handle product_images)
    db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.sendStatus(200);
    });
  });
});

// -------------------- GET SINGLE PRODUCT --------------------
app.get("/product/:id", (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT p.*, GROUP_CONCAT(pi.image_path) as all_images
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send("Product not found");

    const p = results[0];
    p.images = p.all_images ? p.all_images.split(',') : (p.image ? [p.image] : []);
    res.json(p);
  });
});

// -------------------- UPDATE PRODUCT (LAPTOP) --------------------
app.post("/update/:id", upload.array("images", 5), (req, res) => {
  const id = req.params.id;
  const { name, description, price, quantity, brand, category, processor, ram, storage, gpu, screen_size } = req.body;

  if (req.files && req.files.length > 0) {
    // 1. Get old images to delete
    db.query("SELECT image_path FROM product_images WHERE product_id = ?", [id], (err, oldImages) => {
      if (!err && oldImages) {
        oldImages.forEach(row => {
          const fp = path.join(__dirname, row.image_path);
          if (fs.existsSync(fp)) fs.unlink(fp, () => { });
        });
      }

      // 2. Clear old images from DB
      db.query("DELETE FROM product_images WHERE product_id = ?", [id], (err) => {
        // 3. Insert new images
        const imageValues = req.files.map(file => [id, `/uploads/${file.filename}`]);
        db.query("INSERT INTO product_images (product_id, image_path) VALUES ?", [imageValues], (err) => { });

        // 4. Update product details and legacy image column
        const primaryImage = `/uploads/${req.files[0].filename}`;
        db.query(
          `UPDATE products 
           SET name=?, description=?, price=?, quantity=?, image=?, brand=?, category=?, processor=?, ram=?, storage=?, gpu=?, screen_size=? 
           WHERE id=?`,
          [name, description, price, quantity, primaryImage, brand || null, category || 'Ultrabook', processor || null, ram || null, storage || null, gpu || null, screen_size || null, id],
          (err) => {
            if (err) return res.status(500).send(err);
            res.redirect("/upload.html");
          }
        );
      });
    });
  } else {
    // Just update details
    db.query(
      `UPDATE products 
       SET name=?, description=?, price=?, quantity=?, brand=?, category=?, processor=?, ram=?, storage=?, gpu=?, screen_size=? 
       WHERE id=?`,
      [name, description, price, quantity, brand || null, category || 'Ultrabook', processor || null, ram || null, storage || null, gpu || null, screen_size || null, id],
      (err) => {
        if (err) return res.status(500).send(err);
        res.redirect("/upload.html");
      }
    );
  }
});

app.use("/user", cartRoutes);

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Login Server running at http://localhost:${PORT}`)
);





// const PORT = 3000;
// const HOST = '0.0.0.0'; // Allow all network interfaces

// app.listen(PORT, HOST, () => {
//   console.log(`🚀 Server running at http://${require('os').networkInterfaces()['Wi-Fi'][0].address}:${PORT}`);
// });


