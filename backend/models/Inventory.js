// backend/models/Inventory.js
import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  barcode: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, default: "" },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  quantity: { type: Number, required: true },
  expiryDate: { type: Date },
  imageUrl: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

// יצירת אינדקס ייחודי לכל חנות לפי ברקוד
InventorySchema.index({ shopId: 1, barcode: 1 }, { unique: true });

const Inventory = mongoose.model("Inventory", InventorySchema);
export default Inventory;
