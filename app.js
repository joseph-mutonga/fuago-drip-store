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
app.post("/upload", upload.single("image"), (req, res) => {
  const { name, description, price, quantity } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  const sql =
    "INSERT INTO products (name, description, price, quantity, image) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, description, price, quantity, image], (err) => {
    if (err) return res.status(500).send(err);
    // Redirect to upload.html instead of old /
    res.redirect("/upload.html");
  });
});

// -------------------- GET ALL PRODUCTS --------------------
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// -------------------- DELETE PRODUCT --------------------
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT image FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).send(err);

    if (results.length > 0) {
      const imagePath = path.join(__dirname, results[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error("❌ Error deleting image file:", err);
        });
      }
    }

    db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.sendStatus(200);
    });
  });
});

// -------------------- GET SINGLE PRODUCT --------------------
app.get("/product/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send("Product not found");
    res.json(results[0]);
  });
});

// -------------------- UPDATE PRODUCT --------------------
app.post("/update/:id", upload.single("image"), (req, res) => {
  const id = req.params.id;
  const { name, description, price, quantity } = req.body;

  db.query("SELECT image FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send("Product not found");

    const oldImage = results[0].image;

    let sql, values;
    if (req.file) {
      const newImage = `/uploads/${req.file.filename}`;
      const oldImagePath = path.join(__dirname, oldImage);

      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err);
        });
      }

      sql =
        "UPDATE products SET name=?, description=?, price=?, quantity=?, image=? WHERE id=?";
      values = [name, description, price, quantity, newImage, id];
    } else {
      sql =
        "UPDATE products SET name=?, description=?, price=?, quantity=? WHERE id=?";
      values = [name, description, price, quantity, id];
    }

    db.query(sql, values, (err) => {
      if (err) return res.status(500).send(err);
      res.redirect("/upload.html"); // Redirect to upload.html instead of /
    });
  });
});

app.use("/user", cartRoutes);

// const PORT = 3000;
// app.listen(PORT, () =>
//   console.log(`✅ Login Server running at http://localhost:${PORT}`)
// );





const PORT = 3000;
const HOST = '0.0.0.0'; // Allow all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${require('os').networkInterfaces()['Wi-Fi'][0].address}:${PORT}`);
});


