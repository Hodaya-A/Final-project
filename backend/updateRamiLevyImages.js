import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// נתונים עם תמונות מרמי לוי לפי סוג המוצר
const productImageMap = {
  חלב: "https://img.rami-levy.co.il/product/7290000126630/large.jpg",
  ביצים: "https://img.rami-levy.co.il/product/7290000066684/large.jpg",
  קוטג: "https://img.rami-levy.co.il/product/7290000066882/large.jpg",
  "גבינה צהובה": "https://img.rami-levy.co.il/product/7290000067438/large.jpg",
  לחם: "https://img.rami-levy.co.il/product/7290016665888/large.jpg",
  חלה: "https://img.rami-levy.co.il/product/7290016801996/large.jpg",
  מים: "https://img.rami-levy.co.il/product/7290000068817/large.jpg",
  "קוקה קולה": "https://img.rami-levy.co.il/product/7290000126630/large.jpg",
  שוקולד: "https://img.rami-levy.co.il/product/7622300489809/large.jpg",
  עוגיות: "https://img.rami-levy.co.il/product/7622210688507/large.jpg",
  ירקות: "https://img.rami-levy.co.il/product/7290000066929/large.jpg",
  פיצה: "https://img.rami-levy.co.il/product/7290000068817/large.jpg",
  סבון: "https://img.rami-levy.co.il/product/8410436182867/large.jpg",
};

function findImageForProduct(productName) {
  const lowerName = productName.toLowerCase();

  for (const [keyword, imageUrl] of Object.entries(productImageMap)) {
    if (lowerName.includes(keyword.toLowerCase())) {
      return imageUrl;
    }
  }

  // ברירת מחדל - תמונה כללית
  return (
    "https://via.placeholder.com/300x300/e8f5e9/4caf50?text=" +
    encodeURIComponent(productName)
  );
}

async function updateProductImages() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });
    console.log(`📦 נמצאו ${products.length} מוצרים\n`);

    let updated = 0;

    for (const product of products) {
      const imageUrl = findImageForProduct(product.name);

      await Inventory.updateOne(
        { _id: product._id },
        { $set: { imageUrl: imageUrl } }
      );

      console.log(`✅ ${product.name} -> ${imageUrl}`);
      updated++;
    }

    console.log(`\n🎉 עודכנו ${updated} מוצרים בהצלחה!`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updateProductImages();
