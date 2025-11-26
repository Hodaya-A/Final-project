// backend/routes/products.js
import express from "express";
import Inventory from "../models/Inventory.js"; // ✅ שימוש במודל Inventory במקום Product

const router = express.Router();

// ✅ שליפת מוצרים (עם חיפוש וקטגוריה)
router.get("/", async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const categoryFilter = req.query.category;

    const query = {};
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: "i" };
    }
    if (categoryFilter) {
      query.category = categoryFilter;
    }

    // ✅ שליפה ממלאי (Inventory)
    const products = await Inventory.find(query).limit(1000);
    res.json(products);
  } catch (err) {
    console.error("❌ שגיאה בשליפת מוצרים:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ מחיקת כל המוצרים
router.delete("/", async (req, res) => {
  try {
    await Inventory.deleteMany({});
    res
      .status(200)
      .json({ message: "All inventory items deleted successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete inventory.", error: err.message });
  }
});

// ✅ שליפת מוצר לפי ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Inventory.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ עדכון מוצר
router.put("/:id", async (req, res) => {
  try {
    await Inventory.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ מחיקת מוצר בודד
router.delete("/:id", async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 שורה אחרונה
export default router;
