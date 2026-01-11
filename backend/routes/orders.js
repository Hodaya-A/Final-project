import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// יצירת הזמנה חדשה
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      shopId,
      sellerId,
      items,
      totalPrice,
      deliveryMethod,
    } = req.body;

    if (!userId) {
      console.warn("⚠️ WARNING: userId is missing or falsy!");
    }
    if (!shopId) {
      return res.status(400).json({ error: "shopId is required" });
    }

    const newOrder = new Order({
      userId,
      userEmail, // ✅ שמור את הדוא"ל
      shopId,
      sellerId, // ✅ מזהה המוכר (Firebase UID)
      items,
      totalPrice,
      deliveryMethod: deliveryMethod || "delivery",
    });

    await newOrder.save();

    res.status(201).json({
      message: "ההזמנה נשמרה בהצלחה",
      order: newOrder,
    });
  } catch (error) {
    console.error("❌ שגיאה בשמירת הזמנה:", error);
    res.status(500).json({ error: "שגיאה בשמירת הזמנה" });
  }
});

router.get("/pending/store", async (req, res) => {
  try {
    const { shopId, sellerId } = req.query;

    // שקט — אין לוגים לבקשה

    if (!shopId && !sellerId) {
      return res.status(400).json({ error: "shopId or sellerId is required" });
    }

    // בסיס הסינון לפי חנות/מוכר
    const baseFilter = sellerId ? { sellerId } : { shopId };
    // הצג הזמנות שלא סומנו כמוכנות לאיסוף (כולל מאושרות)
    const notReadyFilter = {
      $or: [{ readyForPickup: { $exists: false } }, { readyForPickup: false }],
    };

    const finalFilter = { ...baseFilter, ...notReadyFilter };
    const pendingOrders = await Order.find(finalFilter).sort({ createdAt: -1 });

    // שקט — אין סיכומי לוגים

    res.json({
      orders: pendingOrders,
      count: pendingOrders.length,
    });
  } catch (error) {
    console.error("❌ Error fetching pending orders:", error);
    res.status(500).json({ error: "Failed to fetch pending orders" });
  }
});
router.post("/approve/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. מצא את ההזמנה
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 2. סמן כמאושרת
    order.approvedAt = new Date();
    await order.save();

    // 3. החזר את פרטי ההזמנה כדי שהפרונטאנד ישלח מייל
    res.json({
      success: true,
      message: "Order approved",
      order: {
        id: order._id,
        approvedAt: order.approvedAt,
        userEmail: order.userEmail,
        items: order.items,
        totalPrice: order.totalPrice,
      },
    });
  } catch (error) {
    console.error("❌ Error approving order:", error);
    res.status(500).json({ error: "Failed to approve order" });
  }
});

router.post("/ready/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // מצא את ההזמנה
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // סמן כמוכן לאיסוף
    order.readyForPickup = true;
    order.readyAt = new Date();

    // אם זה משלוח - תן 30 דקות למשלוחנים לקחת
    if (order.deliveryMethod === "delivery") {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      order.readyForPickupExpiresAt = expiresAt;
      // שקט — אין לוגים למועד פקיעה
    }

    await order.save();

    res.json({
      success: true,
      message: "Order ready for pickup",
      order: {
        id: order._id,
        readyForPickup: order.readyForPickup,
        readyAt: order.readyAt,
        readyForPickupExpiresAt: order.readyForPickupExpiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Error marking order as ready:", error);
    res.status(500).json({ error: "Failed to mark order as ready" });
  }
});

// ===== נתיבים ספציפיים =====

// POST סיום משלוח (משלוחן סימן כנמסר)
router.post("/complete-delivery/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.deliveredAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Order marked as delivered",
      order: {
        id: order._id,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error) {
    console.error("❌ Error completing delivery:", error);
    res.status(500).json({ error: "Failed to complete delivery" });
  }
});

// GET משלוחים זמינים
router.get("/available-deliveries/list", async (req, res) => {
  try {
    console.log("🔍 Fetching available deliveries...");
    const availableOrders = await Order.find({
      deliveryMethod: "delivery",
      approvedAt: { $exists: true, $ne: null },
      readyForPickup: true,
      $or: [
        { courierId: { $exists: false } },
        { courierId: null },
        { courierId: "" },
      ],
    }).sort({ readyAt: -1 });

    // שקט — אין סיכומי לוגים

    res.json({
      orders: availableOrders,
      count: availableOrders.length,
    });
  } catch (error) {
    console.error("❌ Error fetching available deliveries:", error);
    res.status(500).json({ error: "Failed to fetch available deliveries" });
  }
});

// POST קבלת משלוח על ידי משלוחן
router.post("/accept-delivery/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { courierId } = req.body;

    if (!courierId) {
      return res.status(400).json({ error: "courierId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.courierId) {
      return res.status(400).json({ error: "Order already assigned" });
    }

    order.courierId = courierId;
    order.courierAssignedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Order accepted",
      order,
    });
  } catch (error) {
    console.error("❌ Error accepting delivery:", error);
    res.status(500).json({ error: "Failed to accept delivery" });
  }
});

// GET משלוחים שלי
router.get("/my-deliveries/:courierId", async (req, res) => {
  try {
    const { courierId } = req.params;

    const myDeliveries = await Order.find({
      courierId,
      deliveryMethod: "delivery",
    }).sort({ courierAssignedAt: -1 });

    // שקט — אין סיכומי לוגים

    res.json({
      orders: myDeliveries,
      count: myDeliveries.length,
    });
  } catch (error) {
    console.error("❌ Error fetching my deliveries:", error);
    res.status(500).json({ error: "Failed to fetch my deliveries" });
  }
});

// ===== נתיבים גנריים (לאחר נתיבים ספציפיים) =====

// שליפת הזמנות של משתמש
router.get("/:userId", async (req, res) => {
  try {
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
