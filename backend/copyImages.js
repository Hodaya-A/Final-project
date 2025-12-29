// העתקת תמונות למוצרים שנכשלו
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "uploads", "images");

async function copyImagesForFailedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB\n");

    // מציאת מוצרים ללא תמונות
    const productsWithoutImages = await Inventory.find({
      $or: [
        { imageUrl: null },
        { imageUrl: "" },
        { imageUrl: { $exists: false } },
      ],
    });

    const existingImages = fs
      .readdirSync(IMAGES_DIR)
      .filter((f) => f.endsWith(".jpg"));

    console.log(`📦 ${productsWithoutImages.length} מוצרים ללא תמונות`);
    console.log(`📸 ${existingImages.length} תמונות זמינות\n`);

    let count = 0;
    for (const product of productsWithoutImages) {
      // בחירת תמונה במחזוריות
      const sourceImage = existingImages[count % existingImages.length];
      const targetFilename = `${product._id}.jpg`;

      const sourcePath = path.join(IMAGES_DIR, sourceImage);
      const targetPath = path.join(IMAGES_DIR, targetFilename);

      fs.copyFileSync(sourcePath, targetPath);

      await Inventory.updateOne(
        { _id: product._id },
        { $set: { imageUrl: `/uploads/images/${targetFilename}` } }
      );

      console.log(`✅ ${product.name} -> ${sourceImage}`);
      count++;
    }

    console.log(`\n✅ הועתקו ${count} תמונות!`);
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

copyImagesForFailedProducts();
