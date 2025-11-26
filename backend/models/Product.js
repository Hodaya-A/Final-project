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
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
});

ProductSchema.index({ location: "2dsphere" });

const Product = mongoose.model("Product", ProductSchema);
export default Product;
