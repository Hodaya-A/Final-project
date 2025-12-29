// סקריפט להורדת תמונות אמיתיות מ-Google Images
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "uploads", "images");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

// יצירת תיקייה אם לא קיימת
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// פונקציה לחיפוש תמונה ב-Google
async function searchImageOnGoogle(productName) {
  try {
    const searchQuery = `${productName} מוצר סופרמרקט`;
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      searchQuery
    )}&cx=${GOOGLE_CX}&searchType=image&key=${GOOGLE_API_KEY}&num=3&imgSize=medium`;

    console.log(`🔍 מחפש תמונה עבור: ${productName}`);

    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.items && response.data.items.length > 0) {
      // ננסה לקחת תמונה מאתר מהימן (שופרסל, רמי לוי, וכו')
      for (const item of response.data.items) {
        const imageUrl = item.link;
        console.log(`   מצא: ${imageUrl.substring(0, 80)}...`);

        // נעדיף תמונות מאתרי סופרמרקט ישראליים
        if (
          imageUrl.includes("shufersal") ||
          imageUrl.includes("rami-levy") ||
          imageUrl.includes("osher-ad") ||
          imageUrl.includes("yochananof") ||
          imageUrl.includes("tivtaam")
        ) {
          return imageUrl;
        }
      }

      // אם לא נמצאה תמונה מסופרמרקט, נחזיר את הראשונה
      return response.data.items[0].link;
    }

    return null;
  } catch (error) {
    console.error(`❌ שגיאה בחיפוש תמונה עבור ${productName}:`, error.message);
    return null;
  }
}

// פונקציה להורדת תמונה
async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const buffer = Buffer.from(response.data);

    // שימוש ב-sharp לשמירת תמונה באיכות טובה
    await sharp(buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(path.join(IMAGES_DIR, filename));

    console.log(`   ✅ הורדה: ${filename}`);
    return true;
  } catch (error) {
    console.error(`   ❌ שגיאה בהורדת ${filename}:`, error.message);
    return false;
  }
}

// פונקציה ראשית
async function downloadRealImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB\n");

    // שליפת כל המוצרים
    const products = await Inventory.find({}).limit(10); // נתחיל עם 10 מוצרים ראשונים
    console.log(`🔍 מעבד ${products.length} מוצרים\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      console.log(`\n📦 מוצר: ${product.name}`);

      // חיפוש תמונה ב-Google
      const imageUrl = await searchImageOnGoogle(product.name);

      if (!imageUrl) {
        console.log(`   ⚠️  לא נמצאה תמונה`);
        failCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // יצירת שם קובץ ייחודי
      const filename = `${product._id}.jpg`;

      // הורדת התמונה
      const success = await downloadImage(imageUrl, filename);

      if (success) {
        // עדכון המוצר עם הנתיב המקומי
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
        console.log(`   ✅ עודכן במסד הנתונים`);
      } else {
        failCount++;
      }

      // המתנה בין בקשות כדי לא לעבור על מכסה
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\n\n📊 סיכום:`);
    console.log(`✅ הצלחות: ${successCount}`);
    console.log(`❌ כישלונות: ${failCount}`);
    console.log(`📁 התמונות נשמרו ב: ${IMAGES_DIR}`);
    console.log(`\n💡 הערה: Google API מגביל ל-100 חיפושים ביום בחינם`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 סיום");
    process.exit(0);
  }
}

// הרצה
downloadRealImages();
