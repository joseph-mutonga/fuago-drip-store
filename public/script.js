// 🧩 script.js (Updated for Admin Authentication)

async function loadProducts() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // 🆕 added

  // 🔒 Redirect if not logged in
  if (!token) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  // 🧠 Redirect normal users to their dashboard
  if (role !== "admin") {
    alert("Access denied. Only admin can view this page.");
    window.location.href = "user-dashboard.html";
    return;
  }

  try {
    const res = await fetch("/products", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to load products.");

    const products = await res.json();
    const container = document.getElementById("product-container");
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML = "<p>No products found.</p>";
      return;
    }

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="price">Ksh ${p.price}</p>
        <p class="desc">${p.description}</p>
        <p class="qty">Qty: ${p.quantity}</p>
        <div class="buttons">
          <button onclick="showEditForm(${p.id}, '${p.name}', '${p.description}', ${p.price}, ${p.quantity}, '${p.image}')" class="edit-btn">Edit</button>
          <button onclick="deleteProduct(${p.id})" class="delete-btn">Delete</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching products:", err);
  }
}

// 🗑️ Delete Product
async function deleteProduct(id) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  if (!confirm("Are you sure you want to delete this product?")) return;

  const res = await fetch(`/delete/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (res.ok) {
    alert("✅ Product deleted successfully!");
    loadProducts();
  } else {
    alert("❌ Error deleting product.");
  }
}

// 🟢 Show Edit Form
function showEditForm(id, name, description, price, quantity, image) {
  const container = document.getElementById("product-container");

  const form = document.createElement("div");
  form.className = "edit-form";
  form.innerHTML = `
    <h3>Edit Product</h3>
    <form id="updateForm" enctype="multipart/form-data">
      <input type="hidden" name="id" value="${id}">
      <label>Name:</label>
      <input type="text" name="name" value="${name}" required>
      
      <label>Description:</label>
      <textarea name="description" required>${description}</textarea>
      
      <label>Price:</label>
      <input type="number" name="price" value="${price}" required>
      
      <label>Quantity:</label>
      <input type="number" name="quantity" value="${quantity}" required>
      
      <label>Current Image:</label>
      <img src="${image}" alt="Current image" style="width:100px; display:block; margin-bottom:10px;">
      
      <label>Change Image (optional):</label>
      <input type="file" name="image" accept="image/*">
      
      <div style="margin-top:10px;">
        <button type="submit">Save Changes</button>
        <button type="button" onclick="cancelEdit()">Cancel</button>
      </div>
    </form>
  `;

  container.innerHTML = "";
  container.appendChild(form);

  document.getElementById("updateForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      window.location.href = "login.html";
      return;
    }

    const formData = new FormData(e.target);
    const id = formData.get("id");

    const res = await fetch(`/update/${id}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      alert("✅ Product updated successfully!");
      loadProducts();
    } else {
      alert("❌ Error updating product.");
    }
  });
}

// 🟡 Cancel Edit
function cancelEdit() {
  loadProducts();
}

// 🚪 Logout Function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "login.html";
}

// 🔄 Load products when page opens
loadProducts();
