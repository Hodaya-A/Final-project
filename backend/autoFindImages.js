// סקריפט למציאת תמונות אוטומטית עם fallback לתמונות ברירת מחדל
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import { fetchImageFromGoogle } from "./utils/fetchImageFromGoogle.js";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "uploads", "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// תמונות ברירת מחדל מ-Cloudinary (כמו שעבד קודם!)
const defaultImages = {
  חלב: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/JCY12_L_P_42015_1.png",
  גבינה:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KXY14_L_P_97825_1.png",
  יוגורט:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/SGG26_L_P_48185_1.png",
  לחם: "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/MYF38_L_P_97412_1.png",
  ירקות:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png",
  קפואים:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png",
  חטיפים:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/BYR52_L_P_17859_1.png",
  משקאות:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png",
  אחזקה:
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png",
};

// פונקציה למציאת תמונת fallback לפי שם מוצר
function getFallbackImageUrl(productName) {
  const name = productName.toLowerCase();

  if (name.includes("יוגורט") || name.includes("יולו"))
    return defaultImages.יוגורט;
  if (name.includes("חלב")) return defaultImages.חלב;
  if (name.includes("גבינה") || name.includes("קוטג"))
    return defaultImages.גבינה;
  if (name.includes("לחם") || name.includes("חלה") || name.includes("פיתה"))
    return defaultImages.לחם;
  if (
    name.includes("ירקות") ||
    name.includes("עגבני") ||
    name.includes("רסק") ||
    name.includes("תירס") ||
    name.includes("קטשופ")
  )
    return defaultImages.ירקות;
  if (
    name.includes("סלמון") ||
    name.includes("דג") ||
    name.includes("טונה") ||
    name.includes("עוף") ||
    name.includes("פיצה")
  )
    return defaultImages.קפואים;
  if (
    name.includes("במבה") ||
    name.includes("ביסלי") ||
    name.includes("שוקולד") ||
    name.includes("ממרח")
  )
    return defaultImages.חטיפים;
  if (
    name.includes("מים") ||
    name.includes("משקה") ||
    name.includes("קפה") ||
    name.includes("תה")
  )
    return defaultImages.משקאות;
  if (
    name.includes("נייר") ||
    name.includes("סבון") ||
    name.includes("אבקת") ||
    name.includes("חיתול") ||
    name.includes("סקוטש")
  )
    return defaultImages.אחזקה;
  if (
    name.includes("אורז") ||
    name.includes("פסטה") ||
    name.includes("עדשים") ||
    name.includes("שמן")
  )
    return defaultImages.משקאות;

  return defaultImages.חלב; // ברירת מחדל כללית
}

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
    await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toFile(path.join(IMAGES_DIR, filename));

    return true;
  } catch (error) {
    return false;
  }
}

async function searchAndDownloadImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const products = await Inventory.find({});

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      try {
        let imageUrl = null;

        // שלב 1: ניסיון חיפוש דרך Google (אם יש ברקוד תקף)
        if (
          product.barcode &&
          product.barcode.trim() &&
          !/^7290{9}\d$/.test(product.barcode)
        ) {
          imageUrl = await fetchImageFromGoogle(product.name, product.barcode);
          if (imageUrl) {
          }
        }

        // שלב 2: אם לא נמצא - שימוש בתמונת ברירת מחדל
        if (!imageUrl) {
          imageUrl = getFallbackImageUrl(product.name);
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
        } else {
          failCount;
        }

        // המתנה בין בקשות
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        failCount++;
      }
    }
  } catch (error) {
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

searchAndDownloadImages();
