// backend/fixPlaceholderUrls.js
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function fixUrls() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    // מצא את כל המוצרים עם via.placeholder.com
    const result = await Inventory.updateMany(
      {
        imageUrl: { $regex: "via\\.placeholder\\.com", $options: "i" },
      },
      {
        $set: { imageUrl: null },
      }
    );

    console.log(`✅ עודכנו ${result.modifiedCount} מוצרים`);
    process.exit(0);
  } catch (error) {
    console.error("❌ שגיאה:", error);
    process.exit(1);
  }
}

fixUrls();
