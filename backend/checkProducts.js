// backend/checkProducts.js
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function checkProducts() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים");

    const products = await Inventory.find().select(
      "name imageUrl price category"
    );
    console.log(`📦 סה"כ מוצרים: ${products.length}\n`);

    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   מחיר: ₪${p.price}`);
      console.log(`   קטגוריה: ${p.category}`);
      console.log(
        `   תמונה: ${p.imageUrl ? "✅ " + p.imageUrl : "❌ אין תמונה"}\n`
      );
    });
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkProducts();
