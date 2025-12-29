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

// ניסיון להוריד מרמי לוי
async function tryRamiLevy(barcode, productId) {
  const urls = [
    `https://img.rami-levy.co.il/product/${barcode}/large.jpg`,
    `https://img.rami-levy.co.il/product/${barcode}/medium.jpg`,
    `https://img.rami-levy.co.il/product/${barcode}/small.jpg`,
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.rami-levy.co.il/",
        },
        timeout: 8000,
        validateStatus: (status) => status === 200,
      });

      if (response.data.byteLength > 1000) {
        // וידוא שזו תמונה אמיתית
        const uploadsDir = path.join(__dirname, "uploads", "images");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `${productId}.jpg`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, response.data);

        return { source: "רמי לוי", path: `/uploads/images/${filename}` };
      }
    } catch (error) {
      // ממשיכים לניסיון הבא
    }
  }
  return null;
}

// ניסיון להוריד משופרסל
async function tryShufersal(barcode, productId) {
  const urls = [
    `https://www.shufersal.co.il/online/he/A/products/${barcode}/image`,
    `https://www.shufersal.co.il/online/he/ItemImages/${barcode}.jpg`,
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.shufersal.co.il/",
        },
        timeout: 8000,
        validateStatus: (status) => status === 200,
      });

      if (response.data.byteLength > 1000) {
        const uploadsDir = path.join(__dirname, "uploads", "images");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `${productId}.jpg`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, response.data);

        return { source: "שופרסל", path: `/uploads/images/${filename}` };
      }
    } catch (error) {
      // ממשיכים לניסיון הבא
    }
  }
  return null;
}

// ניסיון להוריד מיינות ביתן
async function tryYeinotBitan(barcode, productId) {
  const urls = [
    `https://www.yinotbitan.co.il/images/products/${barcode}.jpg`,
    `https://www.yinotbitan.co.il/images/products/${barcode}_large.jpg`,
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.yinotbitan.co.il/",
        },
        timeout: 8000,
        validateStatus: (status) => status === 200,
      });

      if (response.data.byteLength > 1000) {
        const uploadsDir = path.join(__dirname, "uploads", "images");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `${productId}.jpg`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, response.data);

        return { source: "יינות ביתן", path: `/uploads/images/${filename}` };
      }
    } catch (error) {
      // ממשיכים לניסיון הבא
    }
  }
  return null;
}

// תמונות fallback איכותיות מ-Unsplash (רק לחירום)
function getHighQualityFallback(productName, category) {
  const specific = {
    חלב: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=95",
    ביצים:
      "https://images.unsplash.com/photo-1582722872445-44dc1f3ca54c?w=800&q=95",
    קוטג: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=95",
    גבינה:
      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=95",
    לחם: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=95",
    חלה: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=95",
    מים: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=95",
    קוקה: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=95",
    שוקולד:
      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=95",
    עוגיות:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=95",
    ירקות:
      "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&q=95",
    פיצה: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=95",
    סבון: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=95",
  };

  for (const [keyword, url] of Object.entries(specific)) {
    if (productName.includes(keyword)) {
      return url;
    }
  }

  return "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=95";
}

async function downloadFallback(imageUrl, productId) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 8000,
    });

    const uploadsDir = path.join(__dirname, "uploads", "images");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${productId}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, response.data);

    return `/uploads/images/${filename}`;
  } catch (error) {
    console.log(`   ❌ שגיאה בהורדת fallback: ${error.message}`);
    return null;
  }
}

async function processAllProducts() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });
    console.log(`📦 מעבד ${products.length} מוצרים\n`);
    console.log("🎯 מחפש תמונות איכותיות מרמי לוי, שופרסל, יינות ביתן\n");
    console.log("=".repeat(70) + "\n");

    let stats = {
      ramiLevy: 0,
      shufersal: 0,
      yeinotBitan: 0,
      fallback: 0,
      failed: 0,
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(
        `[${i + 1}/${products.length}] 🔍 ${product.name} (ברקוד: ${
          product.barcode
        })`
      );

      let result = null;

      if (product.barcode) {
        // ניסיון 1: רמי לוי
        console.log(`   🛒 מנסה רמי לוי...`);
        result = await tryRamiLevy(product.barcode, product._id);

        if (result) {
          stats.ramiLevy++;
          console.log(`   ✅ הורדה מרמי לוי!`);
        }

        // ניסיון 2: שופרסל
        if (!result) {
          console.log(`   🛒 מנסה שופרסל...`);
          result = await tryShufersal(product.barcode, product._id);

          if (result) {
            stats.shufersal++;
            console.log(`   ✅ הורדה משופרסל!`);
          }
        }

        // ניסיון 3: יינות ביתן
        if (!result) {
          console.log(`   🍷 מנסה יינות ביתן...`);
          result = await tryYeinotBitan(product.barcode, product._id);

          if (result) {
            stats.yeinotBitan++;
            console.log(`   ✅ הורדה מיינות ביתן!`);
          }
        }
      }

      // fallback איכותי
      if (!result) {
        console.log(`   🎨 משתמש בתמונת איכות גבוהה...`);
        const fallbackUrl = getHighQualityFallback(
          product.name,
          product.category
        );
        const localPath = await downloadFallback(fallbackUrl, product._id);

        if (localPath) {
          result = { source: "Unsplash HD", path: localPath };
          stats.fallback++;
          console.log(`   ✅ הורדה מ-Unsplash איכות גבוהה!`);
        } else {
          stats.failed++;
          console.log(`   ❌ נכשל`);
        }
      }

      // עדכון במסד הנתונים
      if (result) {
        await Inventory.updateOne(
          { _id: product._id },
          { $set: { imageUrl: result.path } }
        );
        console.log(`   💾 נשמר: ${result.path} (מקור: ${result.source})\n`);
      } else {
        console.log(`   ⚠️  לא הצלחנו למצוא תמונה\n`);
      }

      // המתנה קצרה בין בקשות
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log("\n" + "=".repeat(70));
    console.log(`🎉 סיימתי!`);
    console.log(`📊 סטטיסטיקות:`);
    console.log(`   🛒 רמי לוי: ${stats.ramiLevy} מוצרים`);
    console.log(`   🛒 שופרסל: ${stats.shufersal} מוצרים`);
    console.log(`   🍷 יינות ביתן: ${stats.yeinotBitan} מוצרים`);
    console.log(`   🎨 Unsplash HD: ${stats.fallback} מוצרים`);
    console.log(`   ❌ נכשלו: ${stats.failed} מוצרים`);
    console.log(
      `   ✅ סה"כ הצלחה: ${
        stats.ramiLevy + stats.shufersal + stats.yeinotBitan + stats.fallback
      }/${products.length}`
    );
    console.log("=".repeat(70));
  } catch (error) {
    console.error("❌ שגיאה כללית:", error);
  } finally {
    await mongoose.disconnect();
  }
}

processAllProducts();
