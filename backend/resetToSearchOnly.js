// מאפס תמונות למוצרים שלא נמצאו דרך מנוע החיפוש
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function resetFailedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    // רשימת המוצרים שנמצאו להם תמונות דרך Google (לשמור אותם!)
    const productsWithRealImages = [
      "6910708fb973119d5980b89f", // חלב תנובה 3%
    ];

    // איפוס כל השאר
    const result = await Inventory.updateMany(
      {
        _id: {
          $nin: productsWithRealImages.map((id) => mongoose.Types.ObjectId(id)),
        },
      },
      { $set: { imageUrl: null } }
    );

    console.log(`✅ אופסו ${result.modifiedCount} מוצרים`);
    console.log("📸 המוצרים ללא תמונות יוצגו עם כפתור העלאה");
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

resetFailedProducts();
