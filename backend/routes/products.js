import express from "express";
import Inventory from "../models/Inventory.js";
import mongoose from "mongoose";
import { db } from "../config/firebaseAdmin.js";
import { createNotificationsForNewProduct } from "../utils/notificationService.js";

const router = express.Router();

// ✅ הוספת מוצר יחיד (מנהל חנות)
router.post("/", async (req, res) => {
  try {
    const userStoreId =
      req.body.shopId || req.user?.storeId || req.user?.shopId || null;

    // ⭐ תיקון: הוספנו את brand לרשימת השדות שאנחנו שולפים מהבקשה
    const {
      name,
      brand, // <--- הוספנו כאן
      price, // הוספתי גם price כי בקוד הפרונט שלך את שולחת price
      salePrice, // הוספתי salePrice כי בקוד הפרונט את שולחת salePrice ולא priceDiscounted
      priceOriginal,
      priceDiscounted,
      expiryDate,
      category,
      imageUrl,
      sellerId,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Missing product name" });
    if (!userStoreId) return res.status(400).json({ error: "Missing shopId" });

    console.log(
      "📦 [POST /products] Creating product:",
      name,
      "Brand:",
      brand,
      "Shop:",
      userStoreId
    );

    // Get store location from Firestore if storeId exists
    let location = null;
    if (userStoreId) {
      try {
        const storeDoc = await db
          .collection("stores")
          .doc(String(userStoreId))
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

    // attempt reverse-geocoding
    let place = null;
    try {
      if (location && location.coordinates) {
        const lat = location.coordinates[1];
        const lon = location.coordinates[0];
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=he`;
        const r = await fetch(url, {
          headers: { "User-Agent": "fresh-end-app/1.0" },
        });
        if (r.ok) {
          const data = await r.json();
          const addr = data?.address || {};
          const city = addr.city || addr.town || addr.village || "";
          place = { city: city || "", address: data?.display_name || "" };
        }
      }
    } catch (e) {
      console.warn("reverse geocode failed:", e.message || e);
    }

    const barcode =
      req.body.barcode ||
      `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // חישוב מחירים (תמיכה גם בשמות הישנים וגם בחדשים מהפרונט)
    const finalPrice =
      salePrice ?? priceDiscounted ?? price ?? priceOriginal ?? 0;
    const finalSalePrice = salePrice ?? priceDiscounted ?? null;
    const finalOriginalPrice = price ?? priceOriginal ?? null;

    const item = await Inventory.create({
      shopId: userStoreId,
      barcode,
      name,
      brand: brand || null, // ⭐ תיקון: שמירת המותג במסד הנתונים
      price: finalPrice,
      priceOriginal: finalOriginalPrice,
      priceDiscounted: finalSalePrice,
      salePrice: finalSalePrice, // שמירה גם בשם הזה ליתר ביטחון
      expiryDate,
      category,
      imageUrl,
      location,
      place,
      sellerId: sellerId || null,
      updatedAt: new Date(),
    });

    createNotificationsForNewProduct(item).catch((err) =>
      console.error("Error creating notifications:", err)
    );

    res.status(201).json(item);
  } catch (err) {
    console.error("❌ שגיאה ביצירת מוצר:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ✅ שליפת מוצרים
router.get("/", async (req, res) => {
  try {
    const { q, category, sellerId, shopId: shopIdRaw } = req.query;
    const query = {};

    if (q) query.name = { $regex: String(q), $options: "i" };
    if (category) query.category = String(category);
    if (sellerId) query.sellerId = String(sellerId);
    if (shopIdRaw) {
      try {
        query.shopId = new mongoose.Types.ObjectId(String(shopIdRaw));
      } catch {
        /* ignore */
      }
    }

    const products = await Inventory.find(query).limit(1000).lean();

    const productsWithStringIds = products.map((product) => ({
      ...product,
      shopId: product.shopId ? String(product.shopId) : undefined,
      _id: String(product._id),
    }));

    res.json(productsWithStringIds);
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
    const product = await Inventory.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });

    const productWithStringIds = {
      ...product,
      shopId: product.shopId ? String(product.shopId) : undefined,
      _id: String(product._id),
    };

    res.json(productWithStringIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ עדכון מוצר
router.put("/:id", async (req, res) => {
  try {
    const product = await Inventory.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const userEmail = req.user?.email || req.body.sellerId;
    if (product.sellerId && userEmail && product.sellerId !== userEmail) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this product" });
    }

    // ב-PUT אנחנו מעבירים את כל ה-body, אז אם ה-brand נמצא ב-body הוא יעודכן אוטומטית
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

export default router;
