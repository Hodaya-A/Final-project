import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import { fetchImageFromGoogle } from "./utils/fetchImageFromGoogle.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

async function findRealImages() {
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

      try {
        // חיפוש תמונה לפי שם בלבד
        const imageUrl = await fetchImageFromGoogle(product.name, "");

        if (imageUrl && imageUrl.startsWith("http")) {
          await Inventory.updateOne(
            { _id: product._id },
            { $set: { imageUrl: imageUrl } }
          );
          console.log(`✅ עודכן: ${imageUrl.substring(0, 80)}...\n`);
          updated++;
        } else {
          console.log(`⚠️  לא נמצאה תמונה\n`);
          failed++;
        }

        // המתנה קצרה בין בקשות (למנוע חסימה)
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ שגיאה: ${error.message}\n`);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`🎉 סיימתי!`);
    console.log(`✅ עודכנו: ${updated} מוצרים`);
    console.log(`❌ נכשלו: ${failed} מוצרים`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ שגיאה כללית:", error);
  } finally {
    await mongoose.disconnect();
  }
}

findRealImages();
