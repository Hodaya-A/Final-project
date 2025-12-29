// סקריפט להורדה ושמירה של תמונות למוצרים
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

// יצירת תיקייה אם לא קיימת
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// מיפוי של תמונות לפי סוג מוצר - תמונות אמיתיות מ-OpenFoodFacts
const productImageMap = {
  // מוצרי חלב
  יוגורט:
    "https://images.openfoodfacts.org/images/products/729/087/200/0029/front_he.5.400.jpg",
  חלב: "https://images.openfoodfacts.org/images/products/729/000/104/7116/front_he.16.400.jpg",
  גבינה:
    "https://images.openfoodfacts.org/images/products/729/000/024/9536/front_he.33.400.jpg",
  חמאה: "https://images.openfoodfacts.org/images/products/729/000/100/0915/front_he.21.400.jpg",

  // לחם ומאפים
  לחם: "https://images.openfoodfacts.org/images/products/729/087/001/0107/front_he.9.400.jpg",
  פיתה: "https://images.openfoodfacts.org/images/products/729/000/900/0206/front_he.4.400.jpg",

  // ירקות ופירות
  עגבני:
    "https://images.openfoodfacts.org/images/products/000/000/018/5706/front_en.3.400.jpg",
  מלפפון:
    "https://images.openfoodfacts.org/images/products/000/000/002/1121/front_en.4.400.jpg",
  בננה: "https://images.openfoodfacts.org/images/products/000/000/003/4300/front_en.3.400.jpg",

  // קפואים
  סלמון:
    "https://images.openfoodfacts.org/images/products/729/000/041/2979/front_he.8.400.jpg",
  שניצל:
    "https://images.openfoodfacts.org/images/products/729/087/000/3908/front_he.6.400.jpg",

  // משקאות
  קפה: "https://images.openfoodfacts.org/images/products/729/000/001/5927/front_he.17.400.jpg",
  תה: "https://images.openfoodfacts.org/images/products/729/000/010/6130/front_he.9.400.jpg",
  מים: "https://images.openfoodfacts.org/images/products/729/087/000/0144/front_he.12.400.jpg",
  מיץ: "https://images.openfoodfacts.org/images/products/729/000/200/6776/front_he.11.400.jpg",

  // אחזקת הבית
  נייר: "https://images.openfoodfacts.org/images/products/729/087/203/2741/front_he.5.400.jpg",
  סבון: "https://images.openfoodfacts.org/images/products/729/087/000/5353/front_he.8.400.jpg",

  // חטיפים ומתוקים
  שוקולד:
    "https://images.openfoodfacts.org/images/products/729/000/010/2040/front_he.22.400.jpg",
  ממרח: "https://images.openfoodfacts.org/images/products/729/000/001/1928/front_he.18.400.jpg",

  // מוצרי יסוד
  ביצים:
    "https://images.openfoodfacts.org/images/products/729/000/400/1109/front_he.7.400.jpg",
  קמח: "https://images.openfoodfacts.org/images/products/729/000/010/8974/front_he.11.400.jpg",
};

// פונקציה להורדת תמונה
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

    // שימוש ב-sharp לשמירת תמונה באיכות טובה
    await sharp(buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(path.join(IMAGES_DIR, filename));

    console.log(`✅ הורדה והתקנה: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ שגיאה בהורדת ${filename}:`, error.message);
    return false;
  }
}

// פונקציה למציאת תמונה מתאימה למוצר
function findImageForProduct(productName) {
  const nameLower = productName.toLowerCase();

  for (const [keyword, imageUrl] of Object.entries(productImageMap)) {
    if (nameLower.includes(keyword)) {
      return imageUrl;
    }
  }

  return null;
}

// פונקציה ראשית
async function downloadAndSaveAllImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    // שליפת כל המוצרים שאין להם תמונה או שהתמונה לא מקומית
    const products = await Inventory.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: "" },
        { imageUrl: { $regex: "^https?://", $options: "i" } }, // תמונות חיצוניות
      ],
    });

    console.log(`\n🔍 נמצאו ${products.length} מוצרים ללא תמונות מקומיות\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      console.log(`\n📦 מעבד: ${product.name}`);

      // מחפש תמונה מתאימה
      let imageUrl = findImageForProduct(product.name);

      if (!imageUrl) {
        console.log(`⚠️  לא נמצאה תמונה עבור: ${product.name}`);
        failCount++;
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
        console.log(`✅ עודכן במסד הנתונים: /uploads/images/${filename}`);
      } else {
        failCount++;
      }

      // המתנה קצרה בין הורדות
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`\n\n📊 סיכום:`);
    console.log(`✅ הצלחות: ${successCount}`);
    console.log(`❌ כישלונות: ${failCount}`);
    console.log(`📁 התמונות נשמרו ב: ${IMAGES_DIR}`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 סיום");
    process.exit(0);
  }
}

// הרצה
downloadAndSaveAllImages();
