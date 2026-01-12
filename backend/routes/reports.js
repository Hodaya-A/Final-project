// backend/routes/reports.js
import express from "express";
import { db } from "../config/firebaseAdmin.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const router = express.Router();

// � דוח הזמנות ממתינות לאישור
router.get("/pending", async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: "sellerId is required" });
    }

    // חפש הזמנות ממתינות (לא מאושרות + לא מוכנות לאיסוף)
    // חפש גם עם sellerId וגם עם DEFAULT (compatibility)
    const filter = {
      $and: [
        { $or: [{ sellerId }, { sellerId: "DEFAULT" }] },
        {
          $or: [
            { readyForPickup: { $exists: false } },
            { readyForPickup: false },
          ],
        },
      ],
    };

    console.log("🔍 [Reports] Searching pending orders with filter:", filter);

    const pendingOrders = await Order.find(filter).sort({ createdAt: -1 });

    console.log(
      `📦 [Reports] Found ${pendingOrders.length} pending orders for sellerId: ${sellerId}`
    );

    res.json({
      orders: pendingOrders,
      count: pendingOrders.length,
    });
  } catch (err) {
    console.error("❌ שגיאה בדוח הזמנות ממתינות:", err);
    res.status(500).json({ error: "Failed to fetch pending orders" });
  }
});

// �📈 דוח מכירות כולל
router.get("/sales", async (req, res) => {
  try {
    const snapshot = await db.collection("orders").get();

    let totalRevenue = 0;
    let orderCount = 0;
    let productStats = {}; // { productName: { sold: 0, total: 0 } }

    snapshot.forEach((doc) => {
      const order = doc.data();
      totalRevenue += order.total;
      orderCount++;

      order.items.forEach((item) => {
        if (!productStats[item.name]) {
          productStats[item.name] = { sold: 0, total: 0 };
        }
        productStats[item.name].sold += item.quantity;
        productStats[item.name].total += item.price * item.quantity;
      });
    });

    res.json({ totalRevenue, orderCount, productStats });
  } catch (err) {
    console.error("❌ שגיאה בדוח מכירות:", err);
    res.status(500).json({ message: "שגיאה בשליפת דוח מכירות" });
  }
});

// ⏰ דוח מוצרים קרובים לתפוגה (תוך 10 ימים)
router.get("/expiring", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(end.getDate() + 10);
    end.setHours(23, 59, 59, 999);

    const expiringProducts = await Product.find({
      expiryDate: { $gte: start, $lte: end },
    });

    res.json(expiringProducts);
  } catch (err) {
    console.error("❌ שגיאה בדוח תפוגה:", err);
    res.status(500).json({ message: "שגיאה בדוח תפוגה" });
  }
});

// 🚫 דוח מוצרים שלא נמכרו כלל
router.get("/unsold", async (req, res) => {
  try {
    const snapshot = await db.collection("orders").get();
    const soldProductIds = new Set();

    snapshot.forEach((doc) => {
      const order = doc.data();
      order.items.forEach((item) => soldProductIds.add(item.id));
    });

    const unsoldProducts = await Product.find({
      _id: { $nin: Array.from(soldProductIds) },
    });

    res.json(unsoldProducts);
  } catch (err) {
    console.error("❌ שגיאה בדוח מוצרים לא נמכרו:", err);
    res.status(500).json({ message: "שגיאה בדוח מוצרים לא נמכרו" });
  }
});

// 🟢 ייצוא ברירת מחדל (חובה לגרסת ESM)
export default router;
