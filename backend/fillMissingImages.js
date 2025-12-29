import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// תמונות Unsplash כ-fallback למי שלא נמצא ב-Open Food Facts
const fallbackImages = {
  "ביצים גודל L":
    "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
  "גבינה צהובה":
    "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop",
  "חלה טרייה":
    "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300&h=300&fit=crop",
  "מים מינרליים 1.5L":
    "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop",
  "עוגיות אוראו":
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop",
  "ירקות קפואים":
    "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&h=300&fit=crop",
  "פיצה קפואה":
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop",
  "סבון כלים":
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300&h=300&fit=crop",
};

async function fillMissingImages() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });
    let updated = 0;

    for (const product of products) {
      const fallbackImage = fallbackImages[product.name];

      if (fallbackImage) {
        await Inventory.updateOne(
          { _id: product._id },
          { $set: { imageUrl: fallbackImage } }
        );
        console.log(`✅ ${product.name} -> Unsplash`);
        updated++;
      }
    }

    console.log(`\n🎉 עודכנו ${updated} מוצרים נוספים עם Unsplash!`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fillMissingImages();
