const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceOriginal: { type: Number, required: true },
  priceDiscounted: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
})

// הפעלת אינדקס גיאוגרפי
productSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Product', productSchema, 'products')
