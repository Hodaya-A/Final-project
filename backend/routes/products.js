const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET /api/products?q=search
router.get("/", async (req, res) => {
  try {
    const searchQuery = req.query.q;
    let query = {};

    if (searchQuery) {
      // חיפוש לפי שם המוצר, לא רגיש לאותיות גדולות/קטנות
      query = { name: { $regex: searchQuery, $options: "i" } };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
