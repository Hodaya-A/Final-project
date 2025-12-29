import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

const workingImages = [
  {
    barcode: "7290001001",
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290001002",
    imageUrl:
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290001003",
    imageUrl:
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290001004",
    imageUrl:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290002001",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290002002",
    imageUrl:
      "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290003001",
    imageUrl:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290003002",
    imageUrl:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290004001",
    imageUrl:
      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290004002",
    imageUrl:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290005001",
    imageUrl:
      "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290005002",
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop",
  },
  {
    barcode: "7290006001",
    imageUrl:
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300&h=300&fit=crop",
  },
];

async function fixImages() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    for (const img of workingImages) {
      const result = await Inventory.updateOne(
        { shopId: DEFAULT_SHOP_ID, barcode: img.barcode },
        { $set: { imageUrl: img.imageUrl } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ עודכן ${img.barcode}`);
      }
    }

    console.log("\n🎉 כל התמונות עודכנו לתמונות עובדות!");
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixImages();
