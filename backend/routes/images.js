// backend/routes/images.js
import express from "express";
import Inventory from "../models/Inventory.js";
import { fetchImageFromGoogle } from "../utils/fetchImageFromGoogle.js";

const router = express.Router();

/** GET /api/debug/image?name=...&barcode=... */
router.get("/debug/image", async (req, res) => {
  const name = (req.query.name || "").trim();
  const barcode = (req.query.barcode || "").trim();
  if (!name && !barcode) {
    return res
      .status(400)
      .json({ ok: false, error: "missing name or barcode" });
  }
  try {
    const url = await fetchImageFromGoogle(name, barcode);
    return res.json({ ok: true, name, barcode, url });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/images/backfill
 * body: { limit?: number, dryRun?: boolean }
 */
router.post("/images/backfill", async (req, res) => {
  const limit = Math.min(Number(req.body?.limit) || 100, 1000);
  const dryRun = !!req.body?.dryRun;

  const criteria = {
    $or: [
      { imageUrl: { $exists: false } },
      { imageUrl: null },
      { imageUrl: "" },
      { imageUrl: { $regex: "^https?://placehold\\.co", $options: "i" } },
      { imageUrl: { $regex: "^/uploads/no-image\\.png$", $options: "i" } },
    ],
  };

  try {
    const items = await Inventory.find(criteria).limit(limit);
    const updates = [];
    for (const item of items) {
      const name = (item.name || "").trim();
      const barcode = (item.barcode || "").trim();
      if (!name && !barcode) continue;

      try {
        const url = await fetchImageFromGoogle(name, barcode);
        if (url && /^https?:\/\//i.test(url)) {
          if (!dryRun) {
            await Inventory.updateOne(
              { _id: item._id },
              { $set: { imageUrl: url, updatedAt: new Date() } }
            );
          }
          updates.push({
            _id: item._id,
            name,
            barcode,
            imageUrl: url,
            status: "ok",
          });
        } else {
          updates.push({
            _id: item._id,
            name,
            barcode,
            imageUrl: null,
            status: "no_result",
          });
        }
      } catch (e) {
        updates.push({
          _id: item._id,
          name,
          barcode,
          imageUrl: null,
          status: "error",
          error: e.message,
        });
      }
    }

    return res.json({ ok: true, processed: updates.length, dryRun, updates });
  } catch (e) {
    console.error("backfill error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
