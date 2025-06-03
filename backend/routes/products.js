const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
// routes/products.js
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    console.log('📦 מוצרים שנשלפו:', products)
    res.json(products); // ⬅️ אין map – שולח את כל המידע כמו שהוא כולל _id
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
