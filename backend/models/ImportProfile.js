// backend/models/ImportProfile.js
import mongoose from "mongoose";

const ImportProfileSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    unique: true,
  },
  mapping: {
    barcode: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: String, required: true },
    category: { type: String },
    salePrice: { type: String },
    expiryDate: { type: String },
  },
  fileOptions: {
    type: { type: String, enum: ["csv", "xlsx", "xls"], default: "csv" },
    delimiter: { type: String, default: "," },
    encoding: { type: String, default: "utf8" },
    headerRowIndex: { type: Number, default: 0 },
    dataStartRow: { type: Number, default: 1 },
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    priceInAgorot: { type: Boolean, default: false },
  },
});

export default mongoose.models.ImportProfile ||
  mongoose.model("ImportProfile", ImportProfileSchema);
