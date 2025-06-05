const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET /api/products?q=search&category=שםקטגוריה
router.get("/", async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const categoryFilter = req.query.category;

    let query = {};

    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: "i" };
    }

    if (categoryFilter) {
      query.category = categoryFilter;
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products - מחיקת כל המוצרים
router.delete("/", async (req, res) => {
  try {
    await Product.deleteMany({});
    res.status(200).json({ message: "All products deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete products.", error: err.message });
  }
});

module.exports = router;
