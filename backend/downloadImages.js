// סקריפט פשוט להורדת ת מונות למוצרים
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

// מיפוי תמונות לפי מילות מפתח במוצר
const productImageMapping = {
  // מוצרי חלב
  יוגורט:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/SGG26_L_P_48185_1.png",
  יולו: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/SGG26_L_P_48185_1.png",
  חלב: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/JCY12_L_P_42015_1.png",
  גבינה:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KXY14_L_P_97825_1.png",
  קוטג: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KXY14_L_P_97825_1.png",
  חמאה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/BYR52_L_P_17859_1.png",

  // לחם ומאפים
  לחם: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/MYF38_L_P_97412_1.png",
  חלה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/MYF38_L_P_97412_1.png",
  פיתה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/MYF38_L_P_97412_1.png",

  // ירקות ופירות
  עגבני:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",
  מלפפון:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",
  בננ: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",
  ירקות:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",
  רסק: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",
  תירס: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",

  // קפואים ובשר
  סלמון:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png",
  דג: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png",
  שניצל:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png",
  פיצה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png",
  עוף: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png",
  טונה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png",

  // משקאות
  קפה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",
  תה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",
  מים: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",
  משקה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",
  מיץ: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",

  // אחזקת הבית
  נייר: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",
  סבון: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",
  סקוטש:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",
  אבקת: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",
  חיתול:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",

  // חטיפים ומתוקים
  שוקולד:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/BYR52_L_P_17859_1.png",
  ממרח: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/BYR52_L_P_17859_1.png",
  במבה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/BYR52_L_P_17859_1.png",
  ביסלי:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/BYR52_L_P_17859_1.png",

  // מוצרי יסוד
  ביצים:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/SGG26_L_P_48185_1.png",
  אורז: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",
  פסטה: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",
  עדשים:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",
  שמן: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",
  קטשופ:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",
};

// פונקציה למציאת תמונה מתאימה לפי שם המוצר
function findImageForProduct(productName) {
  const nameLower = productName.toLowerCase();

  // חיפוש התאמה במיפוי
  for (const [keyword, imageUrl] of Object.entries(productImageMapping)) {
    if (nameLower.includes(keyword)) {
      return imageUrl;
    }
  }

  // אם לא נמצאה התאמה, נחזיר תמונה כללית
  return "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/SGG26_L_P_48185_1.png";
}

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

    console.log(`✅ הורדה: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ שגיאה בהורדת ${filename}:`, error.message);
    return false;
  }
}

// hash function לבחירת תמונה קבועה לפי שם המוצר
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// פונקציה ראשית
async function downloadAndSaveAllImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    // שליפת כל המוצרים שאין להם תמונה מקומית
    const products = await Inventory.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: "" },
        { imageUrl: { $regex: "^https?://", $options: "i" } },
      ],
    });

    console.log(`\n🔍 נמצאו ${products.length} מוצרים ללא תמונות מקומיות\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      console.log(`\n📦 מעבד: ${product.name}`);

      // בחירת תמונה מתאימה לפי שם המוצר
      const imageUrl = findImageForProduct(product.name);
      console.log(`🔍 נבחרה תמונה מתאימה עבור: ${product.name}`);

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
      await new Promise((resolve) => setTimeout(resolve, 100));
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
