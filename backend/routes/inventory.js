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
import { fetchImageFromGoogle } from "../utils/fetchImageFromGoogle.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// מילון שמות אפשריים לעמודות
const SYNONYMS = {
  barcode: ["barcode", "ברקוד", 'מק"ט', "item_code", "sku", "code"],
  name: ["name", "שם מוצר", "תיאור", "description", "product_name"],
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
  salePrice: ["saleprice", "מבצע", "מחיר מבצע", "discount_price"],
  quantity: ["quantity", "כמות", "מלאי", "stock", "onhand"],
  category: ["category", "קטגוריה", "מחלקה", "קבוצה"],
  expiryDate: ["expirydate", "תוקף", "תאריך תפוגה", "exp", "exp_date"],
  imageUrl: ["imageurl", "תמונה", "קישור תמונה", "image", "image_url"],
};

// פונקציה למציאת כותרת מתאימה
const findHeader = (headers, wanted) => {
  const options = SYNONYMS[wanted] || [wanted];
  const normalized = headers.map((h) => (h ?? "").toString().trim());
  const idx = normalized.findIndex((h) =>
    options.some((opt) => h.toLowerCase() === opt.toLowerCase())
  );
  return idx >= 0 ? headers[idx] : null;
};

// מזהה חנות ברירת מחדל (ObjectId תקין)
const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

/** GET /api/inventory */
router.get("/", async (req, res) => {
  try {
    const shopId = req.user?.shopId || DEFAULT_SHOP_ID;
    const { category, q, _page = 1, _limit = 50 } = req.query;

    const filter = { shopId };
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: "i" };

    const page = parseInt(_page);
    const limit = Math.min(parseInt(_limit), 2000);
    const skip = (page - 1) * limit;

    const items = await Inventory.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    res.json(items);
  } catch (err) {
    console.error("❌ שגיאה בשליפת מלאי:", err);
    res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
});

/** POST /api/inventory — הוספת פריט יחיד */
router.post("/", async (req, res) => {
  try {
    const shopId = req.user?.shopId || DEFAULT_SHOP_ID;
    const {
      name,
      barcode,
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

    // נחפש תמונה רק אם אין כבר imageUrl
    if (!finalImageUrl) {
      try {
        finalImageUrl = await fetchImageFromGoogle(name, barcode || "");
      } catch (err) {
        console.warn(`⚠️ שגיאה בשליפת תמונה עבור "${name}":`, err.message);
      }
    }
    console.log(`🖼️ קישור תמונה עבור "${name}": ${finalImageUrl || "אין"}`);

    const item = await Inventory.create({
      shopId,
      barcode: barcode || "",
      name,
      category: category || "",
      price: salePrice ?? price ?? 0,
      salePrice,
      quantity: Number.isNaN(quantity) ? 0 : quantity,
      expiryDate,
      imageUrl: finalImageUrl, // יכול להיות null
      ...(sellerId ? { sellerId } : {}),
      updatedAt: new Date(),
    });

    res.json(item);
  } catch (err) {
    console.error("❌ שגיאה בהוספת מוצר:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

/** POST /api/inventory/upload — העלאת קובץ מלאי (CSV/XLSX) */
router.post("/upload", upload.single("file"), async (req, res) => {
  console.log("=".repeat(80));
  console.log("📤 התקבל בקשת העלאה ל-/api/inventory/upload");
  console.log("🕒 זמן:", new Date().toISOString());
  console.log("📋 req.method:", req.method);
  console.log("📋 req.headers:", JSON.stringify(req.headers, null, 2));
  console.log("📁 req.file:", req.file);
  console.log("📋 req.body:", req.body);
  console.log("=".repeat(80));

  const tmpPath = req.file?.path;
  if (!tmpPath) {
    console.error("❌ לא התקבל קובץ!");
    console.error("req.file is:", req.file);
    console.error("req.body is:", req.body);
    return res.status(400).json({ error: "No file uploaded" });
  }

  const shopId = req.user?.shopId || DEFAULT_SHOP_ID;
  const mode = req.body.mode || "update";
  const sellerId = req.body.sellerId || req.query.sellerId || null;

  console.log("🏪 shopId:", shopId);
  console.log("📧 sellerId:", sellerId);
  console.log("🔄 mode:", mode);

  try {
    if (mode === "renew") {
      await Inventory.deleteMany({ shopId });
    }

    let profile = await ImportProfile.findOne({ shopId });

    // אם אין פרופיל, צור ברירת מחדל
    if (!profile) {
      profile = new ImportProfile({
        shopId,
        name: "Default Profile",
        shopName: "החנות שלי",
        shopLocation: {
          type: "Point",
          coordinates: [34.7818, 32.0853], // תל אביב
        },
        shopAddress: {
          city: "תל אביב",
          street: "",
          number: "",
        },
        fileOptions: {
          encoding: "utf8",
          delimiter: ",",
          headerRowIndex: 0,
          dataStartRow: 1,
          priceInAgorot: false,
          dateFormat: "YYYY-MM-DD",
        },
        mapping: {
          barcode: "ברקוד",
          name: "שם מוצר",
          price: "מחיר",
          quantity: "כמות",
          category: "קטגוריה",
          salePrice: "מחיר מבצע",
          expiryDate: "תוקף",
        },
      });
      await profile.save();
      console.log("✅ נוצר פרופיל ברירת מחדל");
    }

    const fileName = (req.file.originalname || "").toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isXLSX = /\.(xlsx?|xls)$/.test(fileName);

    let rows = [];
    let headers = [];

    if (isCSV) {
      const buf = fs.readFileSync(tmpPath);
      const encoding = profile?.fileOptions?.encoding || "utf8";
      const text = iconv.decode(buf, encoding);

      const delimiter = profile?.fileOptions?.delimiter || ",";
      const headerRowIndex = profile?.fileOptions?.headerRowIndex ?? 0;
      const dataStartRow =
        profile?.fileOptions?.dataStartRow ?? headerRowIndex + 1;

      const parsed = Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        delimiter,
      });

      headers = parsed.data[headerRowIndex] || [];
      const dataRows = parsed.data.slice(dataStartRow);

      rows = dataRows.map((r) => {
        const obj = {};
        headers.forEach((h, i) => (obj[String(h).trim()] = r[i]));
        return obj;
      });
    } else if (isXLSX) {
      const wb = XLSX.readFile(tmpPath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const all = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      const headerRowIndex = profile?.fileOptions?.headerRowIndex ?? 0;
      const dataStartRow =
        profile?.fileOptions?.dataStartRow ?? headerRowIndex + 1;

      headers =
        all[headerRowIndex].map((h) => (h ?? "").toString().trim()) || [];
      rows = all.slice(dataStartRow).map((r) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = r[i]));
        return obj;
      });
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    // מיפוי עמודות
    const mapping = {};
    const wanted = [
      "barcode",
      "name",
      "price",
      "priceOriginal",
      "priceDiscounted",
      "quantity",
      "category",
      "salePrice",
      "expiryDate",
      "imageUrl",
    ];

    if (profile?.mapping) {
      wanted.forEach((k) => {
        const mapped = profile.mapping[k]?.trim();
        mapping[k] =
          headers.find((h) => String(h).trim() === mapped) ||
          findHeader(headers, k);
      });
    } else {
      wanted.forEach((k) => (mapping[k] = findHeader(headers, k)));
    }

    const errors = [];
    const bulk = [];
    const priceInAgorot = !!profile?.fileOptions?.priceInAgorot;
    const dateFormat = profile?.fileOptions?.dateFormat || "YYYY-MM-DD";

    for (const [idx, row] of rows.entries()) {
      const pick = (key) => {
        const col = mapping[key];
        return col ? row[col] : undefined;
      };

      const rawBarcode = (pick("barcode") ?? "").toString().trim();
      const rawName = (pick("name") ?? "").toString().trim();
      const rawPrice = pick("price");
      const rawQty = pick("quantity");

      if (!rawName) {
        errors.push({ row: idx + 1, reason: "Missing name" });
        continue;
      }

      let price = Number(String(rawPrice).replace(/[^\d.-]/g, ""));
      if (Number.isNaN(price)) price = 0;
      if (priceInAgorot) price = price / 100;

      let priceOriginal;
      if (mapping.priceOriginal) {
        const po = Number(
          String(pick("priceOriginal")).replace(/[^\d.-]/g, "")
        );
        if (!Number.isNaN(po)) priceOriginal = priceInAgorot ? po / 100 : po;
      }

      let priceDiscounted;
      if (mapping.priceDiscounted) {
        const pd = Number(
          String(pick("priceDiscounted")).replace(/[^\d.-]/g, "")
        );
        if (!Number.isNaN(pd)) priceDiscounted = priceInAgorot ? pd / 100 : pd;
      }

      const quantity = Number(String(rawQty).replace(/[^\d.-]/g, ""));

      let salePrice;
      if (mapping.salePrice) {
        const sp = Number(String(pick("salePrice")).replace(/[^\d.-]/g, ""));
        if (!Number.isNaN(sp)) salePrice = priceInAgorot ? sp / 100 : sp;
      }

      let expiryDate;
      if (mapping.expiryDate) {
        const raw = String(pick("expiryDate") ?? "").trim();
        const d = dayjs(raw, [dateFormat, "DD/MM/YYYY", "YYYY-MM-DD"], true);
        if (d.isValid()) expiryDate = d.toDate();
      }

      // בדיקה אם יש URL תמונה בקובץ
      let finalImageUrl = null;
      if (mapping.imageUrl) {
        const urlFromFile = String(pick("imageUrl") ?? "").trim();
        if (urlFromFile) {
          finalImageUrl = urlFromFile;
          console.log(`✅ תמונה מהקובץ: ${finalImageUrl}`);
        }
      }

      // אם אין תמונה בקובץ, ננסה לחפש בגוגל
      if (!finalImageUrl) {
        try {
          console.log(
            `🔍 מחפש תמונה ב-Google עבור: "${rawName}" (ברקוד: ${rawBarcode})`
          );
          finalImageUrl = await fetchImageFromGoogle(rawName, rawBarcode);
          if (finalImageUrl) {
            console.log(`✅ נמצאה תמונה: ${finalImageUrl}`);
          }
        } catch (e) {
          console.warn("⚠️ שגיאה בשליפת תמונה למוצר:", rawName, e.message);
        }
      }
      console.log(
        `🖼️ קישור תמונה סופי עבור "${rawName}": ${finalImageUrl || "אין"}`
      );

      // שימוש במיקום של החנות מהפרופיל
      const shopLocation = profile.shopLocation || {
        type: "Point",
        coordinates: [34.7818, 32.0853], // ברירת מחדל: תל אביב
      };

      const shopPlace = profile.shopAddress || {
        city: "תל אביב",
        street: "",
        number: "",
      };

      const doc = {
        shopId,
        barcode: rawBarcode || "",
        name: rawName,
        category: mapping.category ? String(pick("category") || "") : "",
        price: priceDiscounted || price || 0,
        priceOriginal,
        priceDiscounted,
        salePrice,
        quantity: Number.isNaN(quantity) ? 0 : quantity,
        expiryDate,
        location: shopLocation, // מיקום החנות
        place: shopPlace, // כתובת החנות
        ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
        ...(sellerId ? { sellerId } : {}),
        updatedAt: new Date(),
      };

      bulk.push({
        updateOne: {
          filter: {
            shopId,
            barcode: rawBarcode || `auto_${Date.now()}_${idx}`,
          },
          update: { $set: doc },
          upsert: true,
        },
      });
    }

    if (bulk.length) await Inventory.bulkWrite(bulk, { ordered: false });

    console.log("✅ קובץ עובד בהצלחה, מוחק קובץ זמני");
    fs.unlinkSync(tmpPath);

    const response = {
      ok: true,
      mode,
      detectedHeaders: headers,
      usedMapping: mapping,
      totalRows: rows.length,
      processed: bulk.length,
      errors,
    };
    console.log("📤 שולח תשובה:", response);
    res.json(response);
  } catch (err) {
    console.error("=".repeat(80));
    console.error("❌ שגיאה חמורה בעיבוד קובץ מלאי!");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("=".repeat(80));
    try {
      fs.unlinkSync(tmpPath);
    } catch {}
    res.status(500).json({
      error: "Failed to process inventory file",
      details: err.message,
      errorType: err.name,
    });
  }
});

export default router;
