import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// יצירת הזמנה חדשה
router.post("/", async (req, res) => {
  try {
    console.log(
      "POST /api/orders - full body:",
      JSON.stringify(req.body, null, 2)
    );
    const { userId, items, totalPrice } = req.body;

    console.log(
      `[POST Orders] userId='${userId}', itemsCount=${
        items?.length || 0
      }, totalPrice=${totalPrice}`
    );

    if (!userId) {
      console.warn("⚠️ WARNING: userId is missing or falsy!");
    }

    const newOrder = new Order({
      userId,
      items,
      totalPrice,
    });

    await newOrder.save();
    console.log(`✅ Order saved with _id: ${newOrder._id}`);

    res.status(201).json({
      message: "ההזמנה נשמרה בהצלחה",
      order: newOrder,
    });
  } catch (error) {
    console.error("❌ שגיאה בשמירת הזמנה:", error);
    res.status(500).json({ error: "שגיאה בשמירת הזמנה" });
  }
});

// שליפת הזמנות של משתמש
router.get("/:userId", async (req, res) => {
  try {
    console.log("GET /api/orders/:userId - userId:", req.params.userId);
    const orders = await Order.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.error("❌ שגיאה בשליפת הזמנות:", error);
    res.status(500).json({ error: "שגיאה בשליפה" });
  }
});

export default router;
