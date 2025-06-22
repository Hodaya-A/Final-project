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



// ✅ שליפת מוצרים לפי מיקום
// GET /api/products/nearby?lat=...&lng=...
// ✅ שליפת מוצרים לפי מיקום + טווח שנבחר
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing location parameters' });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const radiusNum = parseInt(radius) || 10000; // ברירת מחדל 10 ק\"מ אם לא נשלח פרמטר

  try {
    const products = await Product.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lngNum, latNum]
          },
          $maxDistance: radiusNum
        }
      }
    }).limit(10); // את יכולה לשנות את זה ל-5 או 20 כרצונך

    res.json(products);
  } catch (err) {
    console.error('❌ שגיאה בשרת:', err);
    res.status(500).json({ error: err.message });
  }
});


// שליפת מוצר לפי ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
