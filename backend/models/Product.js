// backend/models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  category: { type: String },
  expiryDate: { type: Date },
  barcode: { type: String },
  quantity: { type: Number, default: 1 },
  imageUrl: { type: String }, // 🖼️ תמונה של המוצר
  description: { type: String }, // 📝 תיאור מפורט של המוצר
  shopId: { type: String, index: true }, // 🏪 מזהה החנות
  shopName: { type: String }, // 🏪 שם החנות
  sellerId: { type: String, index: true }, // 👤 מזהה המוכר
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  place: {
    city: { type: String },
    address: { type: String },
  },
});

ProductSchema.index({ location: "2dsphere" });

const Product = mongoose.model("Product", ProductSchema);
export default Product;
