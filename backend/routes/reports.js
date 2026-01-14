// backend/routes/reports.js
import express from "express";
import { db } from "../config/firebaseAdmin.js";
import Order from "../models/Order.js";
import Inventory from "../models/Inventory.js";

const router = express.Router();

// 🕒 דוח הזמנות ממתינות (רק למוכר הנוכחי)
router.get("/pending", async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId)
      return res.status(400).json({ error: "sellerId is required" });

    const filter = {
      $and: [
        { sellerId: sellerId }, // ✅ חובה להתאים למוכר
        {
          $or: [
            { readyForPickup: { $exists: false } },
            { readyForPickup: false },
          ],
        },
      ],
    };

    const pendingOrders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ orders: pendingOrders, count: pendingOrders.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending orders" });
  }
});

// 📈 דוח מכירות + מלאי (מאובטח בקפדנות)
router.get("/sales", async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId)
      return res.status(400).json({ error: "sellerId is required" });

    console.log(`🔒 מפיק דוח מכירות מאובטח עבור: ${sellerId}`);

    const snapshot = await db.collection("orders").get();

    let totalRevenue = 0;
    let orderCount = 0;
    let productStats = {};

    // 1. איסוף נתונים מההזמנות
    snapshot.forEach((doc) => {
      const order = doc.data();

      // ✅ סינון קפדני: אם ההזמנה לא שייכת למוכר הזה - דלג עליה
      if (order.sellerId !== sellerId) return;

      if (order.status === "REJECTED" || order.status === "CANCELLED") return;

      totalRevenue += order.total || order.totalPrice || 0;
      orderCount++;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const rawName = item.name || item.productName;
          if (!rawName) return;
          const name = rawName.trim(); // ניקוי רווחים

          if (!productStats[name]) {
            productStats[name] = {
              sold: 0,
              total: 0,
              currentStock: 0,
            };
          }
          productStats[name].sold += item.quantity || 0;
          productStats[name].total += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    // 2. שליפת מלאי (רק של המוכר הספציפי!)
    const productNames = Object.keys(productStats);

    if (productNames.length > 0) {
      // ✅ אבטחה: מחפשים רק מוצרים ששייכים ל-sellerId הזה
      const inventoryItems = await Inventory.find({
        name: { $in: productNames },
        sellerId: sellerId, // <--- זה הפילטר הקריטי
      }).select("name quantity sellerId");

      console.log(
        `📦 נמצאו ${inventoryItems.length} מוצרים תואמים במלאי של ${sellerId}`
      );

      inventoryItems.forEach((invItem) => {
        const cleanName = invItem.name.trim();
        if (productStats[cleanName]) {
          productStats[cleanName].currentStock = invItem.quantity;
        }
      });
    }

    res.json({ totalRevenue, orderCount, productStats });
  } catch (err) {
    console.error("❌ שגיאה בדוח מכירות:", err);
    res.status(500).json({ message: "שגיאה בשליפת דוח מכירות" });
  }
});

// ⏰ דוח תפוגה (מאובטח)
router.get("/expiring", async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId)
      return res.status(400).json({ error: "sellerId is required" });

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + 10);
    end.setHours(23, 59, 59, 999);

    // ✅ שליפה רק של מוצרים ששייכים למוכר
    const expiringProducts = await Inventory.find({
      expiryDate: { $gte: start, $lte: end },
      sellerId: sellerId,
    });

    res.json(expiringProducts);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בדוח תפוגה" });
  }
});

// 🚫 דוח לא נמכרו (מאובטח)
router.get("/unsold", async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId)
      return res.status(400).json({ error: "sellerId is required" });

    const snapshot = await db.collection("orders").get();
    const soldNames = new Set();

    snapshot.forEach((doc) => {
      const o = doc.data();
      // ✅ סינון הזמנות לפי מוכר
      if (o.sellerId !== sellerId) return;

      if (o.items)
        o.items.forEach((i) => {
          const n = i.name || i.productName;
          if (n) soldNames.add(n.trim());
        });
    });

    // ✅ שליפת מלאי רק של המוכר
    const unsold = await Inventory.find({
      name: { $nin: Array.from(soldNames) },
      sellerId: sellerId,
    });

    res.json(unsold);
  } catch (err) {
    res.status(500).json({ message: "שגיאה בדוח לא נמכרו" });
  }
});

export default router;
