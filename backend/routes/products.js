// backend/routes/products.js
import express from "express";
import Inventory from "../models/Inventory.js"; // ✅ שימוש במודל Inventory במקום Product
import mongoose from "mongoose";
import { db } from "../config/firebaseAdmin.js";
import { createNotificationsForNewProduct } from "../utils/notificationService.js";

const router = express.Router();

// ✅ הוספת מוצר יחיד (מנהל חנות) - ימפה שדות מה‑frontend ויציב `storeId` מהמזהה ב־req.user
router.post("/", async (req, res) => {
  try {
    const userStoreIdRaw = req.user?.storeId || req.user?.shopId || null;
    let userStoreId = null;
    try {
      userStoreId = userStoreIdRaw
        ? new mongoose.Types.ObjectId(String(userStoreIdRaw))
        : null;
    } catch {
      userStoreId = null;
    }

    const {
      name,
      priceOriginal,
      priceDiscounted,
      expiryDate,
      category,
      imageUrl,
      sellerId,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Missing product name" });

    // Get store location from Firestore if storeId exists
    let location = null;
    if (userStoreId) {
      try {
        const storeDoc = await db
          .collection("stores")
          .doc(String(userStoreIdRaw))
          .get();
        if (storeDoc.exists) {
          const storeData = storeDoc.data();
          if (storeData?.location?.lat && storeData?.location?.lng) {
            location = {
              type: "Point",
              coordinates: [storeData.location.lng, storeData.location.lat],
            };
          }
        }
      } catch (e) {
        console.warn("Failed to fetch store location:", e.message);
      }
    }

    // attempt reverse-geocoding if location provided
    let place = null;
    try {
      if (
        location &&
        location.coordinates &&
        Array.isArray(location.coordinates)
      ) {
        const lat = location.coordinates[1];
        const lon = location.coordinates[0];
        if (typeof lat === "number" && typeof lon === "number") {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
            lat
          )}&lon=${encodeURIComponent(
            lon
          )}&addressdetails=1&accept-language=he`;
          const r = await fetch(url, {
            headers: {
              "User-Agent": "fresh-end-app/1.0 (contact: admin@fresh-end)",
            },
          });
          if (r.ok) {
            const data = await r.json();
            const addr = data?.address || {};
            const city =
              addr.city || addr.town || addr.village || addr.county || "";
            place = { city: city || "", address: data?.display_name || "" };
          }
        }
      }
    } catch (e) {
      console.warn("reverse geocode failed:", e.message || e);
    }

    const item = await Inventory.create({
      shopId: userStoreId,
      name,
      price: priceDiscounted ?? priceOriginal ?? 0,
      priceOriginal: priceOriginal ?? null,
      priceDiscounted: priceDiscounted ?? null,
      expiryDate,
      category,
      imageUrl,
      location,
      place,
      sellerId: sellerId || null,
      updatedAt: new Date(),
    });

    // ✅ יצירת התראות למשתמשים על מוצר חדש (אסינכרוני)
    createNotificationsForNewProduct(item).catch((err) =>
      console.error("Error creating notifications:", err)
    );

    res.status(201).json(item);
  } catch (err) {
    console.error("❌ שגיאה ביצירת מוצר:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ✅ שליפת מוצרים (עם חיפוש וקטגוריה)
router.get("/", async (req, res) => {
  try {
    const { q, category, sellerId, shopId: shopIdRaw } = req.query;

    const query = {};

    // חיפוש לפי שם
    if (q) {
      query.name = { $regex: String(q), $options: "i" };
    }

    // סינון לפי קטגוריה
    if (category) {
      query.category = String(category);
    }

    // הגבלת לפי מזהה המוכר (למשל אימייל של מנהל החנות)
    if (sellerId) {
      query.sellerId = String(sellerId);
    }

    // הגבלת לפי מזהה חנות (ObjectId)
    if (shopIdRaw) {
      try {
        query.shopId = new mongoose.Types.ObjectId(String(shopIdRaw));
      } catch {
        // אם לא תקין נתעלם מהסינון הזה
      }
    }

    // ✅ שליפה ממלאי (Inventory)
    const products = await Inventory.find(query).limit(1000);
    res.json(products);
  } catch (err) {
    console.error("❌ שגיאה בשליפת מוצרים:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ מחיקת כל המוצרים
router.delete("/", async (req, res) => {
  try {
    await Inventory.deleteMany({});
    res
      .status(200)
      .json({ message: "All inventory items deleted successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete inventory.", error: err.message });
  }
});

// ✅ שליפת מוצר לפי ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Inventory.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ עדכון מוצר
router.put("/:id", async (req, res) => {
  try {
    const product = await Inventory.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // בדיקה שהמשתמש יכול לערוך רק את המוצרים שלו
    const userEmail = req.user?.email || req.body.sellerId;
    if (product.sellerId && userEmail && product.sellerId !== userEmail) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this product" });
    }

    await Inventory.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ מחיקת מוצר בודד
router.delete("/:id", async (req, res) => {
  try {
    const product = await Inventory.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // בדיקה שהמשתמש יכול למחוק רק את המוצרים שלו
    const userEmail = req.user?.email || req.body.sellerId;
    if (product.sellerId && userEmail && product.sellerId !== userEmail) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this product" });
    }

    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 שורה אחרונה
export default router;
