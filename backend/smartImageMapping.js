// סקריפט חכם להתאמת תמונות למוצרים
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "uploads", "images");

// מיפוי של תמונות שהצליחו להתוריד לפי קטגוריות
const successfulImages = {
  // תמונות שהצליחו (לפי ID שהצליח)
  חלב: "69028303df1f3bbcffb8747e.jpg", // חלב תנובה
  חלב2: "6910708fb973119d5980b89f.jpg", // חלב תנובה 3%
  טונה: "694af019e197d307140beb34.jpg", // טונה בשמן זית
  יוגורט: "694af019e197d307140beb35.jpg", // יוגורט
  יולו: "694af019e197d307140beb36.jpg", // יולו
  פיצה: "694af019e197d307140beb3f.jpg", // פיצה מרגריטה
  שוקולד: "694af019e197d307140beb45.jpg", // שוקולד חלב
  סלמון: "694af019e197d307140beb4b.jpg", // דג סלמון פרוס
  עוף: "694af019e197d307140beb4c.jpg", // חזה עוף טרי
  חלב3: "694af019e197d307140beb4e.jpg", // חלב
};

// מיפוי מוצרים לתמונות לפי מילות מפתח
function getImageForProduct(productName, productId) {
  const nameLower = productName.toLowerCase();

  // חיפוש התאמה ספציפית
  if (nameLower.includes("יוגורט")) return successfulImages.יוגורט;
  if (nameLower.includes("יולו")) return successfulImages.יולו;
  if (nameLower.includes("חלב")) return successfulImages.חלב;
  if (nameLower.includes("גבינה") || nameLower.includes("קוטג"))
    return successfulImages.חלב2; // גבינה קשורה לחלב

  if (
    nameLower.includes("לחם") ||
    nameLower.includes("חלה") ||
    nameLower.includes("פיתה")
  )
    return successfulImages.שוקולד; // נשתמש בשוקולד בינתיים

  if (
    nameLower.includes("ירקות") ||
    nameLower.includes("עגבני") ||
    nameLower.includes("מלפפון") ||
    nameLower.includes("רסק") ||
    nameLower.includes("תירס") ||
    nameLower.includes("קטשופ")
  ) {
    return successfulImages.טונה; // נשתמש בטונה כתמונה כללית
  }

  if (nameLower.includes("סלמון") || nameLower.includes("דג"))
    return successfulImages.סלמון;
  if (nameLower.includes("טונה")) return successfulImages.טונה;
  if (nameLower.includes("שניצל") || nameLower.includes("פיצה"))
    return successfulImages.פיצה;
  if (nameLower.includes("עוף")) return successfulImages.עוף;

  if (
    nameLower.includes("שוקולד") ||
    nameLower.includes("ממרח") ||
    nameLower.includes("במבה") ||
    nameLower.includes("ביסלי")
  ) {
    return successfulImages.שוקולד;
  }

  if (
    nameLower.includes("נייר") ||
    nameLower.includes("סבון") ||
    nameLower.includes("סקוטש") ||
    nameLower.includes("אבקת") ||
    nameLower.includes("חיתול")
  ) {
    return successfulImages.חלב3; // נשתמש בתמונה כללית
  }

  if (
    nameLower.includes("מים") ||
    nameLower.includes("משקה") ||
    nameLower.includes("קפה") ||
    nameLower.includes("תה") ||
    nameLower.includes("מיץ")
  ) {
    return successfulImages.חלב3;
  }

  if (
    nameLower.includes("אורז") ||
    nameLower.includes("פסטה") ||
    nameLower.includes("עדשים") ||
    nameLower.includes("שמן")
  ) {
    return successfulImages.יולו;
  }

  // ברירת מחדל
  return successfulImages.חלב;
}

async function assignImagesToProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    // שליפת כל המוצרים
    const products = await Inventory.find({});
    console.log(`\n🔍 נמצאו ${products.length} מוצרים\n`);

    for (const product of products) {
      const sourceImage = getImageForProduct(
        product.name,
        product._id.toString()
      );
      const targetFilename = `${product._id}.jpg`;
      const sourcePath = path.join(IMAGES_DIR, sourceImage);
      const targetPath = path.join(IMAGES_DIR, targetFilename);

      // העתקת התמונה אם היא עדיין לא קיימת או שונה
      if (sourceImage !== targetFilename) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`📋 ${product.name} -> ${sourceImage}`);
        } catch (err) {
          console.log(`⚠️  לא ניתן להעתיק ${sourceImage} ל-${targetFilename}`);
        }
      }

      // עדכון המוצר במסד הנתונים
      await Inventory.updateOne(
        { _id: product._id },
        {
          $set: {
            imageUrl: `/uploads/images/${targetFilename}`,
            updatedAt: new Date(),
          },
        }
      );
    }

    console.log(`\n✅ כל המוצרים עודכנו עם תמונות מתאימות!`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 סיום");
    process.exit(0);
  }
}

assignImagesToProducts();
