import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// תמונות אמיתיות מרמי לוי ושופרסל
const productImages = {
  "חלב תנובה 3%": "https://img.rami-levy.co.il/product/7290000126630/large.jpg",
  "ביצים גודל L": "https://img.rami-levy.co.il/product/7290000066684/large.jpg",
  "קוטג' 5%": "https://img.rami-levy.co.il/product/7290000066882/large.jpg",
  "גבינה צהובה": "https://img.rami-levy.co.il/product/7290000067438/large.jpg",
  "לחם פרוס": "https://img.rami-levy.co.il/product/7290016665888/large.jpg",
  "חלה טרייה": "https://img.rami-levy.co.il/product/7290102950836/large.jpg",
  "מים מינרליים 1.5L":
    "https://img.rami-levy.co.il/product/7290000068817/large.jpg",
  "קוקה קולה 1.5L":
    "https://img.rami-levy.co.il/product/5449000000996/large.jpg",
  "שוקולד מילקה": "https://img.rami-levy.co.il/product/7622300489809/large.jpg",
  "עוגיות אוראו": "https://img.rami-levy.co.il/product/7622210688507/large.jpg",
  "ירקות קפואים": "https://img.rami-levy.co.il/product/7290000066929/large.jpg",
  "פיצה קפואה": "https://img.rami-levy.co.il/product/7290110330675/large.jpg",
  "סבון כלים": "https://img.rami-levy.co.il/product/8410436182867/large.jpg",
};

async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.rami-levy.co.il/",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      timeout: 15000,
    });

    const uploadsDir = path.join(__dirname, "uploads", "images");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, response.data);

    return `/uploads/images/${filename}`;
  } catch (error) {
    console.log(`   ❌ שגיאה בהורדת תמונה: ${error.message}`);
    return null;
  }
}

async function downloadAllImages() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });
    console.log(`📦 נמצאו ${products.length} מוצרים\n`);

    let downloaded = 0;

    for (const product of products) {
      console.log(`📥 מוריד תמונה: ${product.name}`);

      const imageUrl = productImages[product.name];

      if (imageUrl) {
        // יצירת שם קובץ ייחודי
        const filename = `${product._id}.jpg`;
        const localPath = await downloadImage(imageUrl, filename);

        if (localPath) {
          await Inventory.updateOne(
            { _id: product._id },
            { $set: { imageUrl: localPath } }
          );
          console.log(`   ✅ הורדה והעתקה לשרת: ${localPath}\n`);
          downloaded++;
        } else {
          console.log(`   ⚠️  נכשל\n`);
        }
      } else {
        console.log(`   ⚠️  לא נמצא URL\n`);
      }

      // המתנה קצרה בין בקשות
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n" + "=".repeat(60));
    console.log(`🎉 סיימתי!`);
    console.log(`✅ הורדו: ${downloaded} תמונות לשרת המקומי`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

downloadAllImages();
