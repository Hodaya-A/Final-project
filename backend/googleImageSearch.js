import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// חיפוש תמונות דרך Google עם הגבלה לאתרים ישראליים
async function searchGoogleImages(productName) {
  try {
    // חיפוש עם הגבלה לאתרים ספציפיים
    const sites =
      "site:rami-levy.co.il OR site:shufersal.co.il OR site:yinotbitan.co.il";
    const searchQuery = `${productName} ${sites}`;

    console.log(`   🔍 Google: "${productName}"`);

    // Google Images search
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      searchQuery
    )}&tbm=isch&tbs=isz:m`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: 12000,
    });

    // חיפוש URLs בתוך קוד ה-JavaScript של Google
    const html = response.data;

    // דפוס לזיהוי URLs של תמונות
    const patterns = [
      /\["(https:\/\/img\.rami-levy\.co\.il\/[^"]+)"\]/g,
      /\["(https:\/\/www\.shufersal\.co\.il\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"\]/g,
      /\["(https:\/\/[^"]*yinotbitan[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"\]/g,
      /"(https:\/\/img\.rami-levy\.co\.il\/product\/\d+\/[^"]+)"/g,
      /"ou":"(https:\/\/img\.rami-levy\.co\.il\/[^"]+)"/g,
    ];

    const foundUrls = new Set();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1];
        if (
          url &&
          (url.includes("rami-levy") ||
            url.includes("shufersal") ||
            url.includes("yinotbitan"))
        ) {
          // ניקוי ה-URL
          const cleanUrl = url.split("\\u003d")[0].split("\\")[0].split("&")[0];
          if (
            cleanUrl.match(/\.(jpg|jpeg|png|webp)$/i) ||
            cleanUrl.includes("/product/")
          ) {
            foundUrls.add(cleanUrl);
          }
        }
      }
    }

    const urls = Array.from(foundUrls);

    if (urls.length > 0) {
      console.log(`   ✅ נמצאו ${urls.length} תמונות!`);
      return urls[0]; // מחזיר את התמונה הראשונה
    }

    console.log(`   ⚠️  לא נמצאו תמונות`);
    return null;
  } catch (error) {
    console.log(`   ❌ שגיאה: ${error.message}`);
    return null;
  }
}

// הורדת תמונה לשרת
async function downloadImage(imageUrl, productId) {
  try {
    console.log(`   📥 מוריד: ${imageUrl.substring(0, 70)}...`);

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: imageUrl.includes("rami-levy")
          ? "https://www.rami-levy.co.il/"
          : imageUrl.includes("shufersal")
          ? "https://www.shufersal.co.il/"
          : "https://www.yinotbitan.co.il/",
      },
      timeout: 10000,
      validateStatus: (status) => status === 200,
    });

    if (response.data.byteLength < 1000) {
      console.log(`   ⚠️  תמונה קטנה מדי`);
      return null;
    }

    const uploadsDir = path.join(__dirname, "uploads", "images");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = imageUrl.includes(".png") ? "png" : "jpg";
    const filename = `${productId}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, response.data);

    console.log(`   ✅ נשמר בהצלחה!`);
    return `/uploads/images/${filename}`;
  } catch (error) {
    console.log(`   ❌ כשל בהורדה: ${error.message}`);
    return null;
  }
}

// תמונת fallback איכותית
function getFallbackImage(productName) {
  const fallbacks = {
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
    נוזל: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=95",
  };

  for (const [keyword, url] of Object.entries(fallbacks)) {
    if (productName.includes(keyword)) {
      return url;
    }
  }

  return "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=95";
}

async function processProducts() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });
    console.log(`📦 מעבד ${products.length} מוצרים\n`);
    console.log(
      "🔍 חיפוש תמונות דרך Google Images מ:\n   • רמי לוי\n   • שופרסל\n   • יינות ביתן\n"
    );
    console.log("=".repeat(70) + "\n");

    let stats = {
      google: 0,
      fallback: 0,
      failed: 0,
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}] 📦 ${product.name}`);

      let localPath = null;

      // חיפוש דרך Google
      const imageUrl = await searchGoogleImages(product.name);

      if (imageUrl) {
        localPath = await downloadImage(imageUrl, product._id);
        if (localPath) {
          stats.google++;
        }
      }

      // אם לא נמצא, fallback איכותי
      if (!localPath) {
        console.log(`   🎨 משתמש בתמונה איכותית...`);
        const fallbackUrl = getFallbackImage(product.name);
        localPath = await downloadImage(fallbackUrl, product._id);
        if (localPath) {
          stats.fallback++;
        } else {
          stats.failed++;
        }
      }

      // עדכון במסד הנתונים
      if (localPath) {
        await Inventory.updateOne(
          { _id: product._id },
          { $set: { imageUrl: localPath } }
        );
        console.log(`   💾 עודכן במסד הנתונים\n`);
      } else {
        console.log(`   ⚠️  לא נמצאה תמונה\n`);
      }

      // המתנה בין בקשות (חשוב למניעת חסימה)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("\n" + "=".repeat(70));
    console.log(`🎉 סיימתי!`);
    console.log(`📊 סטטיסטיקות:`);
    console.log(`   🔍 Google (רמי לוי/שופרסל/ביתן): ${stats.google} מוצרים`);
    console.log(`   🎨 Unsplash HD: ${stats.fallback} מוצרים`);
    console.log(`   ❌ נכשלו: ${stats.failed} מוצרים`);
    console.log(
      `   ✅ סה"כ: ${stats.google + stats.fallback}/${products.length}`
    );
    console.log("=".repeat(70));
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

processProducts();
