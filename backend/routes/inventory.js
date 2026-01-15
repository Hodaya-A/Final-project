// backend/routes/inventory.js
import fs from "fs";
import express from "express";
import multer from "multer";
import Papa from "papaparse";
import XLSX from "xlsx";
import iconv from "iconv-lite";
import dayjs from "dayjs";
import mongoose from "mongoose";

import ImportProfile from "../models/ImportProfile.js";
import Inventory from "../models/Inventory.js";
import { fetchImagesFromGoogle } from "../utils/fetchImageFromGoogle.js";
import { generateImageWithDALLE } from "../utils/generateImageWithGemini.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// מילון שמות אפשריים לעמודות
const SYNONYMS = {
  barcode: ["barcode", "ברקוד", 'מק"ט', "item_code", "sku", "code"],
  name: ["name", "שם מוצר", "product_name"],
  brand: ["brand", "מותג", "חברה", "יצרן", "brand_name"],
  price: ["price", "מחיר", "מחיר ליח'", "מחיר ליחידה"],
  priceOriginal: [
    "priceoriginal",
    "מחיר מקורי",
    "מחיר רגיל",
    "original_price",
    "regular_price",
  ],
  priceDiscounted: [
    "pricediscounted",
    "מחיר מבצע",
    "מחיר מוזל",
    "discounted_price",
    "sale_price",
    "מחיר לאחר הנחה",
  ],
  salePrice: [
    "saleprice",
    "sale_price",
    "מחיר מבצע",
    "מבצע",
    "discount_price",
    "pricediscounted",
    "מחיר לאחר הנחה",
  ],
  quantity: ["quantity", "כמות", "מלאי", "stock", "onhand"],
  category: ["category", "קטגוריה", "מחלקה", "קבוצה"],
  expiryDate: ["expirydate", "תוקף", "תאריך תפוגה", "exp", "exp_date"],
  imageUrl: ["imageurl", "תמונה", "קישור תמונה", "image", "image_url"],
  description: ["description", "תיאור", "פירוט", "תיאור מפורט", "פרטים"],
};

const findHeader = (headers, wanted) => {
  const options = SYNONYMS[wanted] || [wanted];
  const normalized = headers.map((h) => (h ?? "").toString().trim());
  const idx = normalized.findIndex((h) =>
    options.some((opt) => h.toLowerCase() === opt.toLowerCase())
  );
  return idx >= 0 ? headers[idx] : null;
};

const DEFAULT_SHOP_ID = "FrzzphZ80X6CEYONGelr";

/* ======================= Routes ======================= */

/** * GET /api/inventory/sync-locations
 * ⭐ פונקציית תיקון: מעדכנת את מיקום המוצרים במונגו לפי מיקום החנויות בפיירבייס
 */
router.get("/sync-locations", async (req, res) => {
  try {
    const db = req.app.get("db"); // שליפת Firestore שהגדרנו ב-server.js
    if (!db)
      return res
        .status(500)
        .json({ error: "Firebase DB connection not found" });

    console.log("🛠️ [SYNC] Starting product location synchronization...");

    // 1. שליפת כל החנויות מהפיירבייס
    const storesSnapshot = await db.collection("stores").get();
    const storeLocations = {};
    storesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location) {
        storeLocations[doc.id] = data.location;
      }
    });

    // 2. עדכון כל מוצר במונגו לפי ה-shopId שלו
    const products = await Inventory.find({});
    let updatedCount = 0;

    for (const product of products) {
      if (storeLocations[product.shopId]) {
        product.location = storeLocations[product.shopId];
        await product.save();
        updatedCount++;
      }
    }

    console.log(`✅ [SYNC] Complete. Updated ${updatedCount} products.`);
    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} products.`,
    });
  } catch (error) {
    console.error("❌ Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/** GET /api/inventory */
router.get("/", async (req, res) => {
  try {
    const {
      category,
      q,
      _page = 1,
      _limit = 1000, // ⭐ תיקון: מוגדר ל-1000 כדי למנוע חיתוך ב-50
      sellerId,
      minPrice,
      maxPrice,
    } = req.query;

    const filter = {};
    if (sellerId) filter.sellerId = sellerId;
    if (category && !q) filter.category = category;
    else if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const page = parseInt(_page);
    const limit = Math.min(parseInt(_limit), 2000);
    const skip = (page - 1) * limit;

    const items = await Inventory.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    console.log(`📡 [API] Sending ${items.length} items to frontend.`);

    const cleanedItems = items.map((item) => ({
      ...item,
      _id: String(item._id),
      shopId: item.shopId ? String(item.shopId) : undefined,
      sellerId: item.sellerId ? String(item.sellerId) : undefined,
      salePrice: item.salePrice || item.priceDiscounted,
    }));

    res.json(cleanedItems);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/inventory/:id */
router.get("/:id", async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Product not found" });
    res.json(item.toObject());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

/** POST /api/inventory */
router.post("/", async (req, res) => {
  try {
    const shopId = req.user?.shopId || DEFAULT_SHOP_ID;
    const {
      name,
      barcode,
      brand,
      price,
      salePrice,
      category,
      expiryDate,
      quantity,
      imageUrl,
      sellerId,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Missing product name" });

    let finalImageUrl = imageUrl || null;
    if (!finalImageUrl) {
      try {
        const searchQuery = brand ? `${name} ${brand}` : name;
        const imgs = await fetchImagesFromGoogle(searchQuery, barcode || "");
        finalImageUrl = imgs?.[0] || null;
      } catch (err) {
        console.warn(`⚠️ שגיאה בשליפת תמונה עבור "${name}":`, err.message);
      }
    }

    const db = req.app.get("db");
    let shopLocation = { type: "Point", coordinates: [34.7818, 32.0853] };

    if (db) {
      const storeDoc = await db.collection("stores").doc(shopId).get();
      if (storeDoc.exists && storeDoc.data().location) {
        shopLocation = storeDoc.data().location;
      }
    }

    const item = await Inventory.create({
      shopId,
      barcode: barcode || `MANUAL-${Date.now()}`,
      name,
      brand: brand || "",
      category: category || "",
      price: salePrice ?? price ?? 0,
      salePrice,
      quantity: Number(quantity) || 0,
      expiryDate,
      imageUrl: finalImageUrl,
      location: shopLocation,
      sellerId,
      updatedAt: new Date(),
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to add product" });
  }
});

/** PUT /api/inventory/:id */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

/** DELETE /api/inventory/:id */
router.delete("/:id", async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

/** POST /api/inventory/upload */
router.post("/upload", upload.single("file"), async (req, res) => {
  const tmpPath = req.file?.path;
  if (!tmpPath) return res.status(400).json({ error: "No file uploaded" });

  const {
    mode = "update",
    sellerId,
    useAI = false,
    shopId = DEFAULT_SHOP_ID,
  } = req.body;

  try {
    if (mode === "renew") await Inventory.deleteMany({ sellerId });

    const db = req.app.get("db");
    let shopLocation = { type: "Point", coordinates: [34.7818, 32.0853] };

    if (db && shopId) {
      const storeDoc = await db.collection("stores").doc(shopId).get();
      if (storeDoc.exists && storeDoc.data().location) {
        shopLocation = storeDoc.data().location;
      }
    }

    const fileName = req.file.originalname.toLowerCase();
    let rows = [];
    if (fileName.endsWith(".csv")) {
      const buf = fs.readFileSync(tmpPath);
      const text = iconv.decode(buf, "utf8");
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      rows = parsed.data;
    } else {
      const wb = XLSX.readFile(tmpPath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws);
    }

    const bulk = rows.map((row, idx) => ({
      updateOne: {
        filter: { shopId, barcode: row.barcode || `auto_${Date.now()}_${idx}` },
        update: {
          $set: {
            ...row,
            shopId,
            sellerId,
            location: shopLocation,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (bulk.length) await Inventory.bulkWrite(bulk, { ordered: false });
    fs.unlinkSync(tmpPath);
    res.json({ ok: true, processed: bulk.length });
  } catch (err) {
    if (tmpPath) fs.unlinkSync(tmpPath);
    res.status(500).json({ error: err.message });
  }
});

router.post("/fix-missing-seller", async (req, res) => {
  try {
    const { shopId, sellerId } = req.body;
    if (!shopId || !sellerId)
      return res.status(400).json({ error: "Required" });
    const result = await Inventory.updateMany(
      { shopId, $or: [{ sellerId: { $exists: false } }, { sellerId: null }] },
      { $set: { sellerId } }
    );
    res.json({ ok: true, fixed: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fix products" });
  }
});

export default router;
