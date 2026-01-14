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


// -------------------- UPLOAD PRODUCT --------------------
app.post("/upload", upload.array("images", 5), (req, res) => {
  const { name, description, price, quantity } = req.body;
  // Fallback to storing the first image in the legacy 'image' column for backward compatibility
  const primaryImage = req.files && req.files.length > 0 ? `/uploads/${req.files[0].filename}` : "";

  const sql = "INSERT INTO products (name, description, price, quantity, image) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, description, price, quantity, primaryImage], (err, result) => {
    if (err) return res.status(500).send(err);

    const productId = result.insertId;

    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => [productId, `/uploads/${file.filename}`]);
      const imgSql = "INSERT INTO product_images (product_id, image_path) VALUES ?";
      db.query(imgSql, [imageValues], (err2) => {
        if (err2) console.error("Error saving additional images:", err2);
        res.redirect("/upload.html");
      });
    } else {
      res.redirect("/upload.html");
    }
  });
});

// -------------------- GET ALL PRODUCTS --------------------
app.get("/products", (req, res) => {
  const query = `
    SELECT p.*, GROUP_CONCAT(pi.image_path) as all_images
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
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

// -------------------- UPDATE PRODUCT --------------------
app.post("/update/:id", upload.array("images", 5), (req, res) => {
  const id = req.params.id;
  const { name, description, price, quantity } = req.body;

  // Simple update without replacing images logic for now, or just append
  // For simplicity: Update details, and if new images are uploaded, add them.
  // A full "replace images" logic is complex for this scope, so we'll just Append or Replace?
  // Let's go with: Update details always. If new images, delete old and add new (Replace).

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
        db.query("UPDATE products SET name=?, description=?, price=?, quantity=?, image=? WHERE id=?",
          [name, description, price, quantity, primaryImage, id],
          (err) => {
            if (err) return res.status(500).send(err);
            res.redirect("/upload.html");
          }
        );
      });
    });
  } else {
    // Just update details
    db.query("UPDATE products SET name=?, description=?, price=?, quantity=? WHERE id=?",
      [name, description, price, quantity, id],
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


