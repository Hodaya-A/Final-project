// חיפוש תמונות דרך מנוע החיפוש בלבד - ללא ברירות מחדל
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import { fetchImageFromGoogle } from "./utils/fetchImageFromGoogle.js";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "uploads", "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const buffer = Buffer.from(response.data);
    await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toFile(path.join(IMAGES_DIR, filename));

    return true;
  } catch (error) {
    console.error(`   ❌ שגיאה בהורדת ${filename}:`, error.message);
    return false;
  }
}

async function searchOnly() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB\n");

    const products = await Inventory.find({});
    console.log(`🔍 מחפש תמונות ל-${products.length} מוצרים\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      console.log(`\n📦 ${product.name}`);

      try {
        // חיפוש רק דרך מנוע החיפוש Google
        const imageUrl = await fetchImageFromGoogle(
          product.name,
          product.barcode
        );

        if (!imageUrl) {
          console.log(`   ⚠️  לא נמצאה תמונה - יוצג כפתור העלאה ידנית`);
          failCount++;
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        console.log(`   ✅ נמצא: ${imageUrl.substring(0, 60)}...`);

        const filename = `${product._id}.jpg`;
        const success = await downloadImage(imageUrl, filename);

        if (success) {
          await Inventory.updateOne(
            { _id: product._id },
            {
              $set: {
                imageUrl: `/uploads/images/${filename}`,
                updatedAt: new Date(),
              },
            }
          );
          successCount++;
          console.log(`   💾 נשמר בפרויקט`);
        } else {
          failCount++;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ שגיאה: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n\n📊 סיכום:`);
    console.log(`✅ הצלחות: ${successCount} תמונות נמצאו ונשמרו`);
    console.log(`⚠️  כישלונות: ${failCount} מוצרים - יוצג כפתור העלאה ידנית`);
    console.log(`📁 התמונות נשמרו ב: ${IMAGES_DIR}`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 סיום");
    process.exit(0);
  }
}

searchOnly();
