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

// 1. חיפוש לפי ברקוד ב-Open Food Facts
async function searchByBarcode(barcode) {
  if (!barcode) return null;

  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        timeout: 5000,
      }
    );

    if (response.data.status === 1 && response.data.product.image_url) {
      return response.data.product.image_url;
    }
  } catch (error) {
    // שקט, ננסה דרך אחרת
  }

  return null;
}

// 2. חיפוש לפי שם ב-Open Food Facts
async function searchByName(productName) {
  try {
    // תרגום מילות מפתח לאנגלית
    const translations = {
      חלב: "milk",
      ביצים: "eggs",
      קוטג: "cottage cheese",
      גבינה: "cheese",
      לחם: "bread",
      חלה: "challah bread",
      מים: "water",
      קוקה: "coca cola",
      שוקולד: "chocolate",
      עוגיות: "cookies",
      ירקות: "vegetables",
      פיצה: "pizza",
      סבון: "soap",
      יוגורט: "yogurt",
      חמאה: "butter",
      שמן: "oil",
      סוכר: "sugar",
      קפה: "coffee",
      תה: "tea",
    };

    let searchTerm = productName;
    for (const [heb, eng] of Object.entries(translations)) {
      if (productName.includes(heb)) {
        searchTerm = eng;
        break;
      }
    }

    const response = await axios.get(
      "https://world.openfoodfacts.org/cgi/search.pl",
      {
        params: {
          search_terms: searchTerm,
          search_simple: 1,
          action: "process",
          json: 1,
          page_size: 1,
        },
        timeout: 5000,
      }
    );

    if (response.data.products && response.data.products.length > 0) {
      return response.data.products[0].image_url;
    }
  } catch (error) {
    // שקט
  }

  return null;
}

// 3. הורדת תמונה ושמירה לוקאלית
async function downloadImage(imageUrl, productId) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const uploadsDir = path.join(__dirname, "uploads", "images");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = imageUrl.includes(".png") ? "png" : "jpg";
    const filename = `${productId}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, response.data);

    return `/uploads/images/${filename}`;
  } catch (error) {
    return null;
  }
}

// 4. תמונת fallback איכותית של Unsplash
function getFallbackImage(productName, category) {
  const fallbacks = {
    "חלב, ביצים וסלטים":
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
    "לחם ומאפים טריים":
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    משקאות:
      "https://images.unsplash.com/photo-1523677011781-c91d1eba0c34?w=400",
    "חטיפים ומתוקים":
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400",
    קפואים:
      "https://images.unsplash.com/photo-1476887334197-56adbf254e1a?w=400",
    'אחזקת הבית ובע"ח':
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
  };

  return (
    fallbacks[category] ||
    "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400"
  );
}

async function processAllProducts() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );

    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID });

    let stats = {
      byBarcode: 0,
      byName: 0,
      fallback: 0,
      failed: 0,
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      let imageUrl = null;
      let localPath = null;

      // שלב 1: ניסיון לפי ברקוד
      if (product.barcode) {
        imageUrl = await searchByBarcode(product.barcode);
        if (imageUrl) {
          localPath = await downloadImage(imageUrl, product._id);
          if (localPath) {
            stats.byBarcode++;
          }
        }
      }

      // שלב 2: ניסיון לפי שם
      if (!localPath) {
        imageUrl = await searchByName(product.name);
        if (imageUrl) {
          localPath = await downloadImage(imageUrl, product._id);
          if (localPath) {
            stats.byName++;
          }
        }
      }

      // שלב 3: fallback איכותי
      if (!localPath) {
        imageUrl = getFallbackImage(product.name, product.category);
        localPath = await downloadImage(imageUrl, product._id);
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
      } else {
      }

      // המתנה קצרה בין מוצרים
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } catch (error) {
  } finally {
    await mongoose.disconnect();
  }
}

processAllProducts();
