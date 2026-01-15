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

/** GET /api/inventory/sync-locations */
router.get("/sync-locations", async (req, res) => {
  try {
    const db = req.app.get("db");
    if (!db)
      return res
        .status(500)
        .json({ error: "Firebase DB connection not found" });

    const storesSnapshot = await db.collection("stores").get();
    const storeLocations = {};
    storesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location) {
        storeLocations[doc.id] = data.location;
      }
    });

    const products = await Inventory.find({});
    let updatedCount = 0;

    for (const product of products) {
      if (storeLocations[product.shopId]) {
        product.location = storeLocations[product.shopId];
        await product.save();
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} products.`,
    });
  } catch (error) {
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
      _limit = 1000,
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

    const items = await Inventory.find(filter)
      .skip((parseInt(_page) - 1) * parseInt(_limit))
      .limit(parseInt(_limit))
      .sort({ name: 1 })
      .lean();

    res.json(
      items.map((item) => ({
        ...item,
        _id: String(item._id),
        salePrice: item.salePrice || item.priceDiscounted,
      }))
    );
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
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

    // --- ולידציה לשיפור אמינות הנתונים (דוח אלפא עמ' 14, סיכון 9) ---
    if (!name) return res.status(400).json({ error: "Missing product name" });

    // בדיקה למניעת מחיר שלילי
    if (price < 0 || salePrice < 0) {
      return res.status(400).json({ error: "Price cannot be negative" });
    }
    // -----------------------------------------------------------

    let finalImageUrl = imageUrl || null;
    if (!finalImageUrl) {
      try {
        const searchQuery = brand ? `${name} ${brand}` : name;
        const imgs = await fetchImagesFromGoogle(searchQuery, barcode || "");
        finalImageUrl = imgs?.[0] || null;
      } catch (err) {
        console.warn(`⚠️ Error fetching image for "${name}":`, err.message);
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

export default router;
