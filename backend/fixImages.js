// סקריפט לתיקון תמונות - התאמה מדויקת
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "uploads", "images");

// מיפוי תמונות שהצליחו להתוריד
const imageMap = {
  חלב: "69028303df1f3bbcffb8747e.jpg",
  חלב2: "6910708fb973119d5980b89f.jpg",
  טונה: "694af019e197d307140beb34.jpg",
  יוגורט: "694af019e197d307140beb35.jpg",
  יולו: "694af019e197d307140beb36.jpg",
  פיצה: "694af019e197d307140beb3f.jpg",
  שוקולד: "694af019e197d307140beb45.jpg",
  סלמון: "694af019e197d307140beb4b.jpg",
  עוף: "694af019e197d307140beb4c.jpg",
  חלב3: "694af019e197d307140beb4e.jpg",
};

function getCorrectImage(productName, productId) {
  const name = productName.toLowerCase();

  // חטיפים ומתוקים - בהחלט לא חלב!
  if (name.includes("במבה")) return imageMap.שוקולד;
  if (name.includes("ביסלי")) return imageMap.שוקולד;
  if (name.includes("שוקולד")) return imageMap.שוקולד;
  if (name.includes("ממרח")) return imageMap.שוקולד;

  // מוצרי חלב
  if (name.includes("יוגורט")) return imageMap.יוגורט;
  if (name.includes("יולו")) return imageMap.יולו;
  if (name === "חלב" || (name.includes("חלב תנובה") && !name.includes("3%")))
    return imageMap.חלב;
  if (name.includes("חלב") && name.includes("3%")) return imageMap.חלב2;
  if (name.includes("גבינה")) return imageMap.חלב2;
  if (name.includes("קוטג")) return imageMap.חלב2;

  // לחם ומאפים
  if (name.includes("לחם")) return imageMap.יולו;
  if (name.includes("חלה")) return imageMap.יולו;
  if (name.includes("פיתה")) return imageMap.יולו;

  // ירקות
  if (name.includes("ירקות")) return imageMap.טונה;
  if (name.includes("עגבני")) return imageMap.טונה;
  if (name.includes("רסק")) return imageMap.טונה;
  if (name.includes("תירס")) return imageMap.טונה;
  if (name.includes("קטשופ")) return imageMap.טונה;

  // בשר ודגים
  if (name.includes("סלמון")) return imageMap.סלמון;
  if (name.includes("דג")) return imageMap.סלמון;
  if (name.includes("טונה")) return imageMap.טונה;
  if (name.includes("עוף")) return imageMap.עוף;
  if (name.includes("שניצל")) return imageMap.פיצה;
  if (name.includes("פיצה")) return imageMap.פיצה;

  // מוצרי יסוד
  if (name.includes("אורז")) return imageMap.חלב3;
  if (name.includes("פסטה")) return imageMap.חלב3;
  if (name.includes("עדשים")) return imageMap.חלב3;
  if (name.includes("שמן")) return imageMap.חלב3;

  // משקאות ואחזקה
  if (name.includes("מים")) return imageMap.חלב3;
  if (name.includes("משקה")) return imageMap.חלב3;
  if (name.includes("נייר")) return imageMap.חלב3;
  if (name.includes("סבון")) return imageMap.חלב3;
  if (name.includes("סקוטש")) return imageMap.חלב3;
  if (name.includes("אבקת")) return imageMap.חלב3;
  if (name.includes("חיתול")) return imageMap.חלב3;

  // ברירת מחדל
  return imageMap.חלב;
}

async function fixAllImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB\n");

    const products = await Inventory.find({});
    console.log(`🔍 מעבד ${products.length} מוצרים\n`);

    for (const product of products) {
      const sourceImage = getCorrectImage(product.name, product._id.toString());
      const targetFilename = `${product._id}.jpg`;
      const sourcePath = path.join(IMAGES_DIR, sourceImage);
      const targetPath = path.join(IMAGES_DIR, targetFilename);

      // העתקת התמונה
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ ${product.name.padEnd(25)} -> ${sourceImage}`);

        // עדכון במסד הנתונים
        await Inventory.updateOne(
          { _id: product._id },
          { $set: { imageUrl: `/uploads/images/${targetFilename}` } }
        );
      } else {
        console.log(`❌ ${product.name} - תמונת מקור לא נמצאה`);
      }
    }

    console.log(`\n✅ סיום! כל המוצרים עודכנו.`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixAllImages();
