// backend/models/Inventory.js
import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true }, // ✅ Firebase storeId
  barcode: { type: String, default: "", index: true },
  name: { type: String, required: true },

  // ⭐ התיקון הקריטי: הוספת שדה מותג!
  brand: { type: String },

  category: { type: String, default: "" },
  price: { type: Number, required: true },
  priceOriginal: { type: Number },
  priceDiscounted: { type: Number },
  salePrice: { type: Number },
  quantity: { type: Number, default: 0 },

  // ⭐ שדה למעקב מכירות (חדש)
  sold: { type: Number, default: 0 },

  expiryDate: { type: Date },
  imageUrl: { type: String },
  description: { type: String }, // 📝 תיאור מפורט של המוצר

  // פרטי החנות
  shopName: { type: String }, // 🏪 שם החנות
  shopAddress: { type: String }, // 📍 כתובת החנות
  shopCity: { type: String }, // 🌆 עיר

  // GeoJSON location
  location: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number] },
  },

  // Human-readable place information
  place: {
    city: { type: String },
    address: { type: String },
  },

  sellerId: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

// יצירת אינדקס ייחודי לכל חנות לפי ברקוד
InventorySchema.index({ shopId: 1, barcode: 1 }, { unique: true });
// 2dsphere index for geo queries
InventorySchema.index({ location: "2dsphere" });

const Inventory = mongoose.model("Inventory", InventorySchema);
export default Inventory;
