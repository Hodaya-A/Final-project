import express from "express";
import Store from "../models/Store.js"; // מודל ה-MongoDB
import Inventory from "../models/Inventory.js"; // לצורך בדיקת מלאי בחנויות
import { db } from "../config/firebaseAdmin.js"; // חיבור ל-Firebase Firestore
import axios from "axios";

const router = express.Router();

/**
 * GET /api/stores/cleanup
 * ⭐ מנקה חנויות כפולות (לפי שם) או חנויות שאין להן אף מוצר במלאי
 */
router.get("/cleanup", async (req, res) => {
  try {
    console.log("🧹 [CLEANUP] Starting store cleanup process...");
    const snapshot = await db.collection("stores").get();

    if (snapshot.empty) return res.json({ message: "No stores found." });

    const seenNames = new Set();
    const toDelete = [];
    const summary = { deletedDuplicates: 0, deletedEmpty: 0 };

    for (const doc of snapshot.docs) {
      const store = doc.data();
      const storeId = doc.id;

      // 1. בדיקת כפילות לפי שם (מוחק חנויות עם שם זהה שכבר הופיעו)
      if (seenNames.has(store.name)) {
        console.log(`🗑️ Found duplicate store: ${store.name} (ID: ${storeId})`);
        toDelete.push(db.collection("stores").doc(storeId).delete());
        summary.deletedDuplicates++;
        continue;
      }
      seenNames.add(store.name);

      // 2. בדיקה אם קיימים מוצרים המשויכים לחנות זו ב-MongoDB
      const productCount = await Inventory.countDocuments({ shopId: storeId });
      if (productCount === 0) {
        console.log(
          `🗑️ Found empty store (no products): ${store.name} (ID: ${storeId})`
        );
        toDelete.push(db.collection("stores").doc(storeId).delete());
        summary.deletedEmpty++;
      }
    }

    // ביצוע המחיקות ב-Firebase
    await Promise.all(toDelete);

    res.json({
      success: true,
      message: `Cleanup finished. Deleted ${summary.deletedDuplicates} duplicates and ${summary.deletedEmpty} empty stores.`,
      details: summary,
    });
  } catch (error) {
    console.error("🔥 [CLEANUP] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stores/fix-locations
 * פונקציית עזר: הופכת כתובות טקסטואליות לקואורדינטות ומעדכנת את ה-Firebase
 */
router.get("/fix-locations", async (req, res) => {
  try {
    console.log("🛠️ [API STORES] Starting locations fix process...");
    const snapshot = await db.collection("stores").get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No stores found to fix" });
    }

    const updates = [];

    for (const doc of snapshot.docs) {
      const store = doc.data();
      const fullAddress = `${store.street || ""} ${store.houseNumber || ""}, ${
        store.city || ""
      }`;

      if (!store.city && !store.street) {
        console.log(`⏩ Skipping ${store.name} - no address provided.`);
        continue;
      }

      try {
        const geoRes = await axios.get(
          `http://localhost:${process.env.PORT || 3000}/api/geocode`,
          { params: { address: fullAddress } }
        );

        const geoData = Array.isArray(geoRes.data)
          ? geoRes.data[0]
          : geoRes.data;

        if (geoData && geoData.lat && geoData.lon) {
          updates.push(
            db
              .collection("stores")
              .doc(doc.id)
              .update({
                location: {
                  type: "Point",
                  coordinates: [
                    parseFloat(geoData.lon),
                    parseFloat(geoData.lat),
                  ],
                },
              })
          );
          console.log(`✅ Coordinates generated for: ${store.name}`);
        }
      } catch (err) {
        console.error(`❌ Geocoding failed for ${store.name}:`, err.message);
      }
    }

    await Promise.all(updates);
    res.json({
      success: true,
      message: `Successfully updated ${updates.length} stores with coordinates.`,
    });
  } catch (error) {
    console.error("🔥 [FIX LOCATIONS] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stores
 * שליפת כל החנויות מ-Firebase Firestore
 */
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("stores").get();
    if (snapshot.empty) return res.json([]);

    const stores = [];
    snapshot.forEach((doc) => {
      stores.push({ _id: doc.id, ...doc.data() });
    });

    res.json(stores);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch stores", details: error.message });
  }
});

/**
 * GET /api/stores/:storeId
 * שליפת פרטי חנות בודדת מ-MongoDB
 */
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findOne({ storeId });
    if (!store)
      return res.status(404).json({ error: "Store not found in MongoDB" });
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

/**
 * POST /api/stores/:storeId
 * עדכון או יצירת פרטי חנות ב-MongoDB
 */
router.post("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const data = req.body;

    let store = await Store.findOne({ storeId });

    if (!store) {
      store = new Store({
        storeId,
        name: data.name || "New Store",
        commissionRate: data.commissionRate || 0.15,
      });
    }

    // עדכון שדות
    const fields = [
      "name",
      "city",
      "street",
      "houseNumber",
      "commissionRate",
      "description",
      "phone",
      "email",
      "logoUrl",
      "bankAccount",
      "isActive",
    ];
    fields.forEach((field) => {
      if (data[field] !== undefined) store[field] = data[field];
    });

    store.updatedAt = new Date();
    await store.save();

    res.json({ success: true, store });
  } catch (error) {
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

    if (commissionRate < 0 || commissionRate > 1) {
      return res
        .status(400)
        .json({ error: "Commission must be between 0 and 1" });
    }

    const store = await Store.findOneAndUpdate(
      { storeId },
      { commissionRate, updatedAt: new Date() },
      { new: true }
    );

    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json({ success: true, commissionRate: store.commissionRate });
  } catch (error) {
    res.status(500).json({ error: "Failed to update commission" });
  }
});

/**
 * GET /api/stores/:storeId/commission
 */
router.get("/:storeId/commission", async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findOne({ storeId }, { commissionRate: 1 });
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json({ storeId, commissionRate: store.commissionRate });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch commission" });
  }
});

export default router;
