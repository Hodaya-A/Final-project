// backend/models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // ⭐ הוספתי את השורה הזו - עכשיו המותג יישמר במסד הנתונים!
    brand: { type: String },

    price: { type: Number, required: true },
    salePrice: { type: Number }, // מחיר מבצע
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
  },
  { timestamps: true }
); // הוספתי timestamps כדי שיהיה תאריך יצירה ועדכון (מומלץ)

ProductSchema.index({ location: "2dsphere" });

const Product = mongoose.model("Product", ProductSchema);
export default Product;
