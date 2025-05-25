const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  expiryDate: Date
});

module.exports = mongoose.model('Product', productSchema, 'products');
