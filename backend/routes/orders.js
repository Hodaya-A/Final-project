import express from "express";
import Order from "../models/Order.js";
import Inventory from "../models/Inventory.js"; // ⭐ הוספנו ייבוא של המלאי

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
      status: "PENDING",
    });

    await newOrder.save();

    // ⭐⭐ התחלת קוד עדכון מלאי אוטומטי ⭐⭐
    if (items && items.length > 0) {
      try {
        const bulkOps = items.map((item) => ({
          updateOne: {
            // מסתמכים על productId או _id שנמצא בפריט ההזמנה
            filter: { _id: item.productId || item._id },
            update: {
              $inc: {
                quantity: -item.quantity, // מורידים את הכמות שנקנתה
                sold: item.quantity, // מוסיפים לכמות שנמכרה
              },
            },
          },
        }));

        if (bulkOps.length > 0) {
          await Inventory.bulkWrite(bulkOps);
          console.log(
            "✅ Inventory updated: quantities decreased, sold counts increased."
          );
        }
      } catch (invError) {
        console.error("⚠️ Failed to update inventory counts:", invError);
      }
    }
    // ⭐⭐ סוף קוד עדכון מלאי ⭐⭐

    // Emit real-time event to store manager
    const io = req.app.get("io");
    if (io && shopId) {
      const roomName = `shop-${shopId}`;
      console.log(`📤 Attempting to emit new-order to room: ${roomName}`);
      console.log(`📤 Order ID: ${newOrder._id}`);
      console.log(`📤 Socket.io instance exists: ${!!io}`);

      io.to(roomName).emit("new-order", {
        orderId: newOrder._id,
        order: newOrder,
      });

      // Check how many clients are in the room
      io.in(roomName)
        .allSockets()
        .then((sockets) => {
          console.log(`✅ New order event emitted to shop-${shopId}`);
          console.log(`👥 Number of clients in room: ${sockets.size}`);
          console.log(`👥 Client IDs: ${Array.from(sockets).join(", ")}`);
        });
    } else {
      console.warn("⚠️ Socket.io not available or shopId missing");
    }

    res.status(201).json({
      message: "ההזמנה נשמרה בהצלחה",
      order: newOrder,
    });
  } catch (error) {
    console.error("❌ שגיאה בשמירת הזמנה:", error);
    res.status(500).json({ error: "שגיאה בשמירת הזמנה" });
  }
});

// ... שאר הנתיבים בקובץ נשארים ללא שינוי, העתקתי לך אותם ליתר ביטחון ...

router.get("/pending/store", async (req, res) => {
  try {
    const { shopId, sellerId } = req.query;

    if (!shopId && !sellerId) {
      return res.status(400).json({ error: "shopId or sellerId is required" });
    }

    const baseFilter = sellerId ? { sellerId } : { shopId };
    const notReadyFilter = {
      $or: [{ readyForPickup: { $exists: false } }, { readyForPickup: false }],
    };

    const finalFilter = { ...baseFilter, ...notReadyFilter };

    console.log("🔍 Searching for pending orders with filter:", finalFilter);

    const pendingOrders = await Order.find(finalFilter).sort({ createdAt: -1 });

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

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.approvedAt = new Date();
    order.status = "APPROVED";
    await order.save();

    const io = req.app.get("io");
    if (io && order.userId) {
      io.to(`customer-${order.userId}`).emit("order-approved", {
        orderId: order._id,
        status: order.status,
      });
    }

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

router.post("/reject/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = "REJECTED";
    await order.save();

    const io = req.app.get("io");
    if (io && order.userId) {
      io.to(`customer-${order.userId}`).emit("order-rejected", {
        orderId: order._id,
        status: order.status,
      });
    }

    res.json({
      success: true,
      message: "Order rejected",
      order: {
        id: order._id,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("❌ Error rejecting order:", error);
    res.status(500).json({ error: "Failed to reject order" });
  }
});

router.post("/ready/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.readyForPickup = true;
    order.readyAt = new Date();
    order.status = "READY_FOR_PICKUP";

    if (order.deliveryMethod === "delivery") {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      order.readyForPickupExpiresAt = expiresAt;
    }

    await order.save();

    const io = req.app.get("io");
    if (io) {
      if (order.deliveryMethod === "delivery") {
        io.emit("delivery-available", {
          orderId: order._id,
          order,
        });
      }
      if (order.userId) {
        io.to(`customer-${order.userId}`).emit("order-ready", {
          orderId: order._id,
          status: order.status,
          deliveryMethod: order.deliveryMethod,
        });
      }
    }

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

router.post("/complete-delivery/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.deliveredAt = new Date();
    order.status = "DELIVERED";
    await order.save();

    const io = req.app.get("io");
    if (io && order.userId) {
      io.to(`customer-${order.userId}`).emit("order-delivered", {
        orderId: order._id,
        status: order.status,
      });
    }

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
    })
      .sort({ readyAt: -1 })
      .lean();

    const ordersWithShopInfo = await Promise.all(
      availableOrders.map(async (order) => {
        let shopName = null;
        let shopAddress = null;

        if (order.shopId) {
          try {
            const storeDoc = await req.app
              .get("db")
              .collection("stores")
              .doc(order.shopId)
              .get();
            if (storeDoc.exists) {
              const storeData = storeDoc.data();
              shopName = storeData.name;
              shopAddress = storeData.address;
            }
          } catch (e) {
            console.warn("Failed to fetch shop info:", e.message);
          }
        }

        return {
          ...order,
          shopName,
          shopAddress,
        };
      })
    );

    res.json({
      orders: ordersWithShopInfo,
      count: ordersWithShopInfo.length,
    });
  } catch (error) {
    console.error("❌ Error fetching available deliveries:", error);
    res.status(500).json({ error: "Failed to fetch available deliveries" });
  }
});

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
    order.status = "COURIER_ASSIGNED";
    await order.save();

    const io = req.app.get("io");
    if (io && order.userId) {
      io.to(`customer-${order.userId}`).emit("courier-assigned", {
        orderId: order._id,
        status: order.status,
      });
    }

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

router.get("/my-deliveries/:courierId", async (req, res) => {
  try {
    const { courierId } = req.params;

    const myDeliveries = await Order.find({
      courierId,
      deliveryMethod: "delivery",
    })
      .sort({ courierAssignedAt: -1 })
      .lean();

    const ordersWithShopInfo = await Promise.all(
      myDeliveries.map(async (order) => {
        let shopName = null;
        let shopAddress = null;

        if (order.shopId) {
          try {
            const storeDoc = await req.app
              .get("db")
              .collection("stores")
              .doc(order.shopId)
              .get();
            if (storeDoc.exists) {
              const storeData = storeDoc.data();
              shopName = storeData.name;
              shopAddress = storeData.address;
            }
          } catch (e) {
            console.warn("Failed to fetch shop info:", e.message);
          }
        }

        return {
          ...order,
          shopName,
          shopAddress,
        };
      })
    );

    res.json({
      orders: ordersWithShopInfo,
      count: ordersWithShopInfo.length,
    });
  } catch (error) {
    console.error("❌ Error fetching my deliveries:", error);
    res.status(500).json({ error: "Failed to fetch my deliveries" });
  }
});

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
