import express from "express";
import Store from "../models/Store.js";

const router = express.Router();

/**
 * GET /api/stores/:storeId
 * Fetch store details including commission rate
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
 * Create or update store details
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
    } = req.body;

    // Validate commission rate
    if (commissionRate !== undefined) {
      if (commissionRate < 0 || commissionRate > 1) {
        return res.status(400).json({
          error: "Commission rate must be between 0 and 1 (0 to 100%)",
        });
      }
    }

    // Find or create store
    let store = await Store.findOne({ storeId });

    if (!store) {
      store = new Store({
        storeId,
        name: name || "New Store",
        commissionRate: commissionRate || 0.15,
      });
    }

    // Update fields
    if (name !== undefined) store.name = name;
    if (city !== undefined) store.city = city;
    if (street !== undefined) store.street = street;
    if (houseNumber !== undefined) store.houseNumber = houseNumber;
    if (commissionRate !== undefined) store.commissionRate = commissionRate;
    if (description !== undefined) store.description = description;
    if (phone !== undefined) store.phone = phone;
    if (email !== undefined) store.email = email;
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
 * Update only the commission rate
 */
router.patch("/:storeId/commission", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { commissionRate } = req.body;

    // Validate commission rate
    if (commissionRate === undefined || commissionRate === null) {
      return res.status(400).json({ error: "Commission rate is required" });
    }

    if (commissionRate < 0 || commissionRate > 1) {
      return res.status(400).json({
        error: "Commission rate must be between 0 and 1 (0 to 100%)",
      });
    }

    const store = await Store.findOneAndUpdate(
      { storeId },
      {
        commissionRate,
        updatedAt: new Date(),
      },
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
 * Get only the commission rate for a store
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
