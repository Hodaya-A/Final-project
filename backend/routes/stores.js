import express from "express";
import Store from "../models/Store.js"; // מודל ה-MongoDB הקיים שלך
import { db } from "../config/firebaseAdmin.js"; // ודאי שהנתיב לקובץ הגדרות ה-Firebase Admin נכון

const router = express.Router();

/**
 * GET /api/stores
 * שליפת כל החנויות מקולקציית STORES ב-Firebase Firestore
 * זה הנתיב שפותר את שגיאת ה-404 במפה
 */
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("STORES").get();
    const stores = [];

    snapshot.forEach((doc) => {
      stores.push({
        _id: doc.id, // שימוש ב-ID של המסמך כ-ID של החנות
        ...doc.data(),
      });
    });

    res.json(stores);
  } catch (error) {
    console.error("Error fetching all stores from Firebase:", error);
    res.status(500).json({ error: "Failed to fetch stores from Firebase" });
  }
});

/**
 * GET /api/stores/:storeId
 * שליפת פרטי חנות בודדת (MongoDB)
 */
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findOne({ storeId });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

/**
 * POST /api/stores/:storeId
 * עדכון או יצירת פרטי חנות (MongoDB)
 */
router.post("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      name,
      city,
      street,
      houseNumber,
      commissionRate,
      description,
      phone,
      email,
      bankAccount,
      isActive,
      logoUrl,
    } = req.body;

    if (commissionRate !== undefined) {
      if (commissionRate < 0 || commissionRate > 1) {
        return res.status(400).json({
          error: "Commission rate must be between 0 and 1",
        });
      }
    }

    let store = await Store.findOne({ storeId });

    if (!store) {
      store = new Store({
        storeId,
        name: name || "New Store",
        commissionRate: commissionRate || 0.15,
      });
    }

    if (name !== undefined) store.name = name;
    if (city !== undefined) store.city = city;
    if (street !== undefined) store.street = street;
    if (houseNumber !== undefined) store.houseNumber = houseNumber;
    if (commissionRate !== undefined) store.commissionRate = commissionRate;
    if (description !== undefined) store.description = description;
    if (phone !== undefined) store.phone = phone;
    if (email !== undefined) store.email = email;
    if (logoUrl !== undefined) store.logoUrl = logoUrl;
    if (bankAccount !== undefined) store.bankAccount = bankAccount;
    if (isActive !== undefined) store.isActive = isActive;

    store.updatedAt = new Date();
    await store.save();

    res.json({
      success: true,
      message: "Store updated successfully",
      store,
    });
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({ error: "Failed to update store" });
  }
});

/**
 * PATCH /api/stores/:storeId/commission
 */
router.patch("/:storeId/commission", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { commissionRate } = req.body;

    if (commissionRate === undefined || commissionRate === null) {
      return res.status(400).json({ error: "Commission rate is required" });
    }

    if (commissionRate < 0 || commissionRate > 1) {
      return res.status(400).json({
        error: "Commission rate must be between 0 and 1",
      });
    }

    const store = await Store.findOneAndUpdate(
      { storeId },
      { commissionRate, updatedAt: new Date() },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json({
      success: true,
      message: "Commission rate updated successfully",
      commissionRate: store.commissionRate,
    });
  } catch (error) {
    console.error("Error updating commission rate:", error);
    res.status(500).json({ error: "Failed to update commission rate" });
  }
});

/**
 * GET /api/stores/:storeId/commission
 */
router.get("/:storeId/commission", async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findOne({ storeId }, { commissionRate: 1 });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json({
      storeId,
      commissionRate: store.commissionRate,
    });
  } catch (error) {
    console.error("Error fetching commission rate:", error);
    res.status(500).json({ error: "Failed to fetch commission rate" });
  }
});

export default router;
