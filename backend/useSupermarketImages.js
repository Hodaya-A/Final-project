import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import axios from "axios";
import * as cheerio from "cheerio";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// פונקציה לחיפוש ב-Google עם הגבלה לרמי לוי ושופרסל
async function searchSupermarketImage(productName) {
  try {
    // חיפוש עם הגבלה ספציפית לאתרים
    const searchQuery = `${productName} site:rami-levy.co.il OR site:shufersal.co.il`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
      searchQuery
    )}&tbm=isch`;

    console.log(`   🔍 מחפש ב: ${searchQuery}`);

    const response = await axios.get(googleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // חיפוש תמונות בתוצאות
    const images = [];
    $("img").each((i, elem) => {
      const src = $(elem).attr("src") || $(elem).attr("data-src");
      if (
        src &&
        (src.includes("rami-levy.co.il") || src.includes("shufersal.co.il"))
      ) {
        images.push(src);
      }
    });

    // חיפוש גם בלינקים
    $("a").each((i, elem) => {
      const href = $(elem).attr("href");
      if (
        href &&
        (href.includes("rami-levy.co.il") ||
          href.includes("shufersal.co.il")) &&
        (href.includes(".jpg") ||
          href.includes(".png") ||
          href.includes(".webp"))
      ) {
        images.push(href);
      }
    });

    if (images.length > 0) {
      console.log(`   ✅ נמצא: ${images[0]}`);
      return images[0];
    }

    console.log(`   ⚠️  לא נמצאה תמונה`);
    return null;
  } catch (error) {
    console.log(`   ❌ שגיאה: ${error.message}`);
    return null;
  }
}

// מיפוי ידני של מוצרים לתמונות מרמי לוי/שופרסל (ברקודים אמיתיים)
const knownProductImages = {
  "חלב תנובה 3%": "https://img.rami-levy.co.il/product/7290000126630/large.jpg",
  חלב: "https://img.rami-levy.co.il/product/7290000126630/large.jpg",
  "ביצים גודל L": "https://img.rami-levy.co.il/product/7290000066684/large.jpg",
  ביצים: "https://img.rami-levy.co.il/product/7290000066684/large.jpg",
  "קוטג' 5%": "https://img.rami-levy.co.il/product/7290000066882/large.jpg",
  "קוטג'": "https://img.rami-levy.co.il/product/7290000066882/large.jpg",
  "גבינה צהובה": "https://img.rami-levy.co.il/product/7290000067438/large.jpg",
  גבינה: "https://img.rami-levy.co.il/product/7290000067438/large.jpg",
  "לחם פרוס": "https://img.rami-levy.co.il/product/7290016665888/large.jpg",
  לחם: "https://img.rami-levy.co.il/product/7290016665888/large.jpg",
  "חלה טרייה": "https://www.shufersal.co.il/online/he/A/product/P_3210/image",
  חלה: "https://www.shufersal.co.il/online/he/A/product/P_3210/image",
  "מים מינרליים": "https://img.rami-levy.co.il/product/7290000068817/large.jpg",
  מים: "https://img.rami-levy.co.il/product/7290000068817/large.jpg",
  "קוקה קולה": "https://img.rami-levy.co.il/product/5449000000996/large.jpg",
  קוקה: "https://img.rami-levy.co.il/product/5449000000996/large.jpg",
  "שוקולד מילקה": "https://img.rami-levy.co.il/product/7622300489809/large.jpg",
  שוקולד: "https://img.rami-levy.co.il/product/7622300489809/large.jpg",
  "עוגיות אוראו": "https://img.rami-levy.co.il/product/7622210688507/large.jpg",
  עוגיות: "https://img.rami-levy.co.il/product/7622210688507/large.jpg",
  "ירקות קפואים": "https://img.rami-levy.co.il/product/7290000066929/large.jpg",
  ירקות: "https://img.rami-levy.co.il/product/7290000066929/large.jpg",
  "פיצה קפואה":
    "https://www.shufersal.co.il/online/he/A/product/P_522813/image",
  פיצה: "https://www.shufersal.co.il/online/he/A/product/P_522813/image",
  "סבון כלים": "https://img.rami-levy.co.il/product/8410436182867/large.jpg",
  סבון: "https://img.rami-levy.co.il/product/8410436182867/large.jpg",
};

function findKnownImage(productName) {
  const lowerName = productName.toLowerCase();

  // חיפוש התאמה מדויקת
  if (knownProductImages[productName]) {
    return knownProductImages[productName];
  }

  // חיפוש חלקי
  for (const [keyword, imageUrl] of Object.entries(knownProductImages)) {
    if (lowerName.includes(keyword.toLowerCase())) {
      return imageUrl;
    }
  }

  return null;
}

async function updateFromSupermarkets() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });
    console.log(`📦 נמצאו ${products.length} מוצרים\n`);

    let updated = 0;

    for (const product of products) {
      console.log(`🔍 מעדכן: ${product.name}`);

      // תחילה ננסה מהמיפוי הידני
      let imageUrl = findKnownImage(product.name);

      if (imageUrl) {
        await Inventory.updateOne(
          { _id: product._id },
          { $set: { imageUrl: imageUrl } }
        );
        console.log(`   ✅ עודכן מהמיפוי הידני\n`);
        updated++;
      } else {
        // אם לא נמצא, ננסה לחפש
        imageUrl = await searchSupermarketImage(product.name);

        if (imageUrl) {
          await Inventory.updateOne(
            { _id: product._id },
            { $set: { imageUrl: imageUrl } }
          );
          console.log(`   ✅ עודכן מחיפוש\n`);
          updated++;
        } else {
          console.log(`   ⚠️  לא נמצא - ישאר כמו שהוא\n`);
        }
      }

      // המתנה קצרה בין בקשות
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log("\n" + "=".repeat(60));
    console.log(`🎉 סיימתי!`);
    console.log(`✅ עודכנו: ${updated} מוצרים עם תמונות מרמי לוי/שופרסל`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updateFromSupermarkets();
