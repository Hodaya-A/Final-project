// backend/models/ImportProfile.js
import mongoose from "mongoose";
import express from "express";
import ImportProfile from "../models/ImportProfile.js";
const router = express.Router();

const ImportProfileSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    unique: true,
  },
  // 🧩 מיפוי עמודות: המפתח = השם אצלנו, הערך = השם בקובץ של החנות
  mapping: {
    barcode: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: String, required: true },
    category: { type: String },
    salePrice: { type: String },
    expiryDate: { type: String },
  },
  // 🧾 הגדרות קובץ
  fileOptions: {
    type: {
      type: String,
      enum: ["csv", "xlsx", "xls"],
      default: "csv",
    },
    delimiter: { type: String, default: "," },
    encoding: { type: String, default: "utf8" },
    headerRowIndex: { type: Number, default: 0 },
    dataStartRow: { type: Number, default: 1 },
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    priceInAgorot: { type: Boolean, default: false },
  },
});

// ✅ שורה זו מחליפה את module.exports:
export default router;
