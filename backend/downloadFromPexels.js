// סקריפט להורדת תמונות מ-Unsplash (בחינם)
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

// Unsplash Access Key (חינמי - 50 בקשות לשעה)
const UNSPLASH_ACCESS_KEY = "XqFjhGJnhL8b9VK8QmZ5xQ8zYvN5xN5xN5xN5xN5xN5"; // זה רק לדוגמה, תחליף במפתח אמיתי

// יצירת תיקייה אם לא קיימת
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// מיפוי מוצרים למילות חיפוש באנגלית (Unsplash עובד טוב יותר באנגלית)
const productSearchTerms = {
  יוגורט: "yogurt product",
  יולו: "yogurt drink",
  חלב: "milk bottle",
  "גבינה לבנה": "white cheese",
  "גבינה צהובה": "yellow cheese",
  קוטג: "cottage cheese",
  חמאה: "butter",
  לחם: "bread loaf",
  חלה: "challah bread",
  פיתה: "pita bread",
  עגבני: "tomatoes",
  מלפפון: "cucumber",
  בננ: "banana",
  ירקות: "vegetables",
  רסק: "tomato sauce",
  תירס: "corn",
  סלמון: "salmon fish",
  דג: "fish",
  טונה: "tuna can",
  שניצל: "chicken schnitzel",
  פיצה: "frozen pizza",
  עוף: "chicken breast",
  קפה: "coffee",
  תה: "tea",
  מים: "water bottle",
  משקה: "soft drink",
  "נייר טואלט": "toilet paper",
  סבון: "soap",
  סקוטש: "paper towels",
  "אבקת כביסה": "laundry detergent",
  חיתול: "diapers",
  שוקולד: "chocolate bar",
  ממרח: "chocolate spread",
  במבה: "peanut snack",
  ביסלי: "snack bag",
  ביצים: "eggs",
  אורז: "rice",
  פסטה: "pasta",
  עדשים: "lentils",
  שמן: "olive oil",
  קטשופ: "ketchup bottle",
};

// פונקציה למציאת מילת חיפוש מתאימה
function getSearchTerm(productName) {
  const nameLower = productName.toLowerCase();

  for (const [hebrewTerm, englishTerm] of Object.entries(productSearchTerms)) {
    if (nameLower.includes(hebrewTerm)) {
      return englishTerm;
    }
  }

  return "food product"; // ברירת מחדל
}

// פונקציה לחיפוש תמונה ב-Unsplash (ללא API key - נשתמש בתמונות קבועות)
async function getImageUrl(productName) {
  const searchTerm = getSearchTerm(productName);

  // מאחר ו-Unsplash דורש רישום, נשתמש בתמונות מ-Pexels שהוא חינמי לגמרי
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      searchTerm
    )}&per_page=1`;

    console.log(`🔍 מחפש: ${searchTerm}`);

    // Pexels API key חינמי לגמרי
    const response = await axios.get(url, {
      headers: {
        Authorization:
          "563492ad6f91700001000001fa8015e3d47645f0a96b4ee954a2a23d",
      },
      timeout: 10000,
    });

    if (response.data.photos && response.data.photos.length > 0) {
      return response.data.photos[0].src.medium;
    }

    return null;
  } catch (error) {
    console.error(`❌ שגיאה בחיפוש:`, error.message);
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

    await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
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
async function downloadImagesFromPexels() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB\n");

    const products = await Inventory.find({}).limit(15);
    console.log(`🔍 מעבד ${products.length} מוצרים\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      console.log(`\n📦 ${product.name}`);

      const imageUrl = await getImageUrl(product.name);

      if (!imageUrl) {
        console.log(`   ⚠️  לא נמצאה תמונה`);
        failCount++;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

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
        console.log(`   ✅ עודכן במסד הנתונים`);
      } else {
        failCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    console.log(`\n\n📊 סיכום:`);
    console.log(`✅ הצלחות: ${successCount}`);
    console.log(`❌ כישלונות: ${failCount}`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 סיום");
    process.exit(0);
  }
}

downloadImagesFromPexels();
