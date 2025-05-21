const express = require('express')
const router = express.Router()
const Product = require('../models/Product')

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const query = req.query.q
    const products = query
      ? await Product.find({ name: { $regex: query, $options: 'i' } })
      : await Product.find()
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בקבלת מוצרים' })
  }
})

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const newProduct = new Product(req.body)
    await newProduct.save()
    res.status(201).json(newProduct)
  } catch (err) {
    res.status(400).json({ error: 'שגיאה בהוספת מוצר' })
  }
})

module.exports = router
