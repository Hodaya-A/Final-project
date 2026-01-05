// backend/routes/importProfiles.js
import express from "express";
import ImportProfile from "../models/ImportProfile.js";
import mongoose from "mongoose";

const router = express.Router();

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// GET /api/importProfiles - שליפת פרופיל של חנות
router.get("/", async (req, res) => {
  try {
    const shopId = req.user?.shopId || DEFAULT_SHOP_ID;
    let profile = await ImportProfile.findOne({ shopId });

    if (!profile) {
      // יצירת פרופיל ברירת מחדל
      profile = await ImportProfile.create({
        shopId,
        shopName: "החנות שלי",
        shopLocation: {
          type: "Point",
          coordinates: [34.7818, 32.0853],
        },
        shopAddress: {
          city: "תל אביב",
          street: "",
          number: "",
        },
        mapping: {
          barcode: "ברקוד",
          name: "שם מוצר",
          price: "מחיר",
          quantity: "כמות",
        },
        fileOptions: {
          encoding: "utf8",
          delimiter: ",",
          headerRowIndex: 0,
          dataStartRow: 1,
          dateFormat: "YYYY-MM-DD",
          priceInAgorot: false,
        },
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("❌ שגיאה בשליפת פרופיל:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/importProfiles/location - עדכון מיקום החנות
router.put("/location", async (req, res) => {
  try {
    const shopId = req.user?.shopId || DEFAULT_SHOP_ID;
    const { shopName, coordinates, city, street, number } = req.body;

    console.log("📍 עדכון/יצירת מיקום חנות:", {
      shopId,
      shopName,
      coordinates,
      city,
      street,
      number,
    });

    const update = {
      shopName,
      shopLocation: {
        type: "Point",
        coordinates: coordinates || [34.7818, 32.0853],
      },
      shopAddress: {
        city: city || "",
        street: street || "",
        number: number || "",
      },
    };

    const profile = await ImportProfile.findOneAndUpdate(
      { shopId },
      { $set: update },
      { new: true, upsert: true } // ✅ שינוי: upsert: true כדי ליצור אם לא קיים
    );

    console.log("✅ מיקום חנות עודכן/נוצר בהצלחה");
    res.json({ ok: true, profile });
  } catch (err) {
    console.error("❌ שגיאה בעדכון מיקום:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/importProfiles - שמירת פרופיל מלא
router.post("/", async (req, res) => {
  try {
    const shopId = req.user?.shopId || DEFAULT_SHOP_ID;
    const profileData = { ...req.body, shopId };

    const profile = await ImportProfile.findOneAndUpdate(
      { shopId },
      profileData,
      { new: true, upsert: true }
    );

    res.json({ ok: true, profile });
  } catch (err) {
    console.error("❌ שגיאה בשמירת פרופיל:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
