import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

async function updateImages() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const updates = [
      {
        barcode: "7290000001",
        imageUrl:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop",
      },
      {
        barcode: "7290000002",
        imageUrl:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop",
      },
      {
        barcode: "7290000003",
        imageUrl:
          "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=300&fit=crop",
      },
      {
        barcode: "7290000004",
        imageUrl:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        barcode: "7290000005",
        imageUrl:
          "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop",
      },
      {
        barcode: "7290000006",
        imageUrl:
          "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop",
      },
      {
        barcode: "7290000007",
        imageUrl:
          "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop",
      },
      {
        barcode: "7290000008",
        imageUrl:
          "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop",
      },
    ];

    for (const update of updates) {
      const result = await Inventory.updateOne(
        { shopId: DEFAULT_SHOP_ID, barcode: update.barcode },
        { $set: { imageUrl: update.imageUrl } }
      );
      console.log(`✅ עודכן ${update.barcode}: ${result.modifiedCount} מוצרים`);
    }

    console.log("\n🎉 כל התמונות עודכנו!");

    // הצגת המוצרים
    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID }).select(
      "name imageUrl"
    );
    console.log("\n📦 מוצרים במערכת:");
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   ${p.imageUrl}\n`);
    });
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updateImages();
