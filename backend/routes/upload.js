// backend/routes/upload.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Inventory from "../models/Inventory.js";
import sharp from "sharp";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// הגדרת אחסון עם multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const productId = req.body.productId;
    cb(null, `${productId}.jpg`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // מקסימום 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("רק קבצי תמונה מותרים"));
    }
  },
});

// POST /api/upload/product-image
router.post("/product-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "לא הועלתה תמונה" });
    }

    const productId = req.body.productId;
    if (!productId) {
      return res.status(400).json({ error: "חסר מזהה מוצר" });
    }

    // עיבוד התמונה עם sharp
    const outputPath = path.join(
      __dirname,
      "../uploads/images",
      `${productId}.jpg`
    );

    await sharp(req.file.path)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toFile(outputPath + ".tmp");

    // החלפת הקובץ המקורי
    fs.renameSync(outputPath + ".tmp", outputPath);

    // עדכון המוצר במסד הנתונים
    await Inventory.updateOne(
      { _id: productId },
      {
        $set: {
          imageUrl: `/uploads/images/${productId}.jpg`,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      imageUrl: `/uploads/images/${productId}.jpg`,
      message: "התמונה הועלתה בהצלחה",
    });
  } catch (error) {
    console.error("שגיאה בהעלאת תמונה:", error);
    res.status(500).json({ error: "שגיאה בהעלאת התמונה" });
  }
});

export default router;
