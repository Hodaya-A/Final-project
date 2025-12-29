import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import axios from "axios";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// פונקציה לחיפוש תמונה ב-Open Food Facts לפי שם המוצר
async function searchProductImage(productName) {
  try {
    // חיפוש באנגלית
    const searchQuery = productName
      .toLowerCase()
      .replace("חלב", "milk")
      .replace("ביצים", "eggs")
      .replace("קוטג", "cottage cheese")
      .replace("גבינה", "cheese")
      .replace("לחם", "bread")
      .replace("חלה", "challah bread")
      .replace("מים", "water")
      .replace("קוקה קולה", "coca cola")
      .replace("שוקולד", "chocolate")
      .replace("עוגיות", "cookies")
      .replace("ירקות", "vegetables")
      .replace("פיצה", "pizza")
      .replace("סבון", "soap");

    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      searchQuery
    )}&search_simple=1&action=process&json=1&page_size=1`;

    const response = await axios.get(url, { timeout: 5000 });

    if (response.data.products && response.data.products.length > 0) {
      const product = response.data.products[0];
      const imageUrl =
        product.image_url || product.image_front_url || product.image_small_url;

      if (imageUrl) {
        console.log(`   ✅ נמצא: ${imageUrl.substring(0, 60)}...`);
        return imageUrl;
      }
    }

    console.log(`   ⚠️  לא נמצאה תמונה`);
    return null;
  } catch (error) {
    console.log(`   ❌ שגיאה: ${error.message}`);
    return null;
  }
}

async function updateWithOpenFoodFacts() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });
    console.log(`📦 נמצאו ${products.length} מוצרים\n`);

    let updated = 0;
    let failed = 0;

    for (const product of products) {
      console.log(`🔍 מחפש תמונה עבור: ${product.name}`);

      const imageUrl = await searchProductImage(product.name);

      if (imageUrl) {
        await Inventory.updateOne(
          { _id: product._id },
          { $set: { imageUrl: imageUrl } }
        );
        updated++;
      } else {
        failed++;
      }

      // המתנה קצרה בין בקשות
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n" + "=".repeat(50));
    console.log(`🎉 סיימתי!`);
    console.log(`✅ עודכנו: ${updated} מוצרים`);
    console.log(`❌ נכשלו: ${failed} מוצרים`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updateWithOpenFoodFacts();
