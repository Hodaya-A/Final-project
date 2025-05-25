const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    console.log('📦 מוצרים שנשלפו:', products)
    res.json(products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      expiryDate: p.expiryDate
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
