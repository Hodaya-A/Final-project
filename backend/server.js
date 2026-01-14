// backend/server.js
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import emailjs from "@emailjs/nodejs";
import checkout from "@paypal/checkout-server-sdk";
import { createServer } from "http";
import { Server } from "socket.io";

// models
import Inventory from "./models/Inventory.js";
import Order from "./models/Order.js";

// routes
import inventoryRoutes from "./routes/inventory.js";
import importProfilesRoutes from "./routes/importProfiles.js";
import productRoutes from "./routes/products.js";
import reportRoutes from "./routes/reports.js";
import imagesRoutes from "./routes/images.js";
import ordersRouter from "./routes/orders.js";
import paymentsRoutes, { setSocketIO } from "./routes/payments.js"; // ⭐ יבוא משולב ותקין
import storesRoutes from "./routes/stores.js";
import emailRouter from "./routes/email.js";
import geocodeRoutes from "./routes/geocode.js";
import uploadRoutes from "./routes/upload.js";
import usersRoutes from "./routes/users.js";
import notificationsRoutes from "./routes/notifications.js";
import analyticsRoutes from "./routes/analytics.js";

// Firebase Admin
import { auth, db } from "./config/firebaseAdmin.js";
import { createExpiringProductNotifications } from "./utils/notificationService.js";
import { getPaypalClient, getCurrency } from "./utils/paypalClient.js";

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Socket.IO for payments logic
setSocketIO(io);

// Make io and db available to routes
app.set("io", io);
app.set("db", db);

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join-shop", (shopId) => {
    socket.join(`shop-${shopId}`);
    console.log(`📦 Socket ${socket.id} joined shop-${shopId}`);
  });

  socket.on("join-customer", (userId) => {
    socket.join(`customer-${userId}`);
    console.log(`👤 Socket ${socket.id} joined customer-${userId}`);
  });

  socket.on("join-courier", (courierId) => {
    socket.join(`courier-${courierId}`);
    console.log(`🚚 Socket ${socket.id} joined courier-${courierId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

/* ======================= Middleware ======================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// סטטי
app.use("/uploads", express.static("uploads"));
app.use("/uploads/images", express.static("uploads/images"));

/* ======================= MongoDB ======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    // ⭐ לוג בדיקה: כמה מוצרים יש באמת במסד הנתונים?
    const count = await Inventory.countDocuments();
    console.log(`📊 Total products found in MongoDB: ${count}`);
  })
  .catch((err) => console.error("❌ שגיאה בחיבור למונגו:", err));

/* ======================= Routes ======================= */
app.use("/api/inventory", inventoryRoutes);
app.use("/api/importProfiles", importProfilesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", imagesRoutes);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRoutes);
app.use("/api/stores", storesRoutes); // ⭐ ודאי שבקובץ stores.js יש router.get("/")
app.use("/api", emailRouter);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/analytics", analyticsRoutes);

/* ======================= Start Server ======================= */
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io is ready for connections`);
});

/* ======================= לוגיקה של ניקוי מוצרים והחזרים ======================= */

async function removeExpiredProducts() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await Inventory.deleteMany({ expiryDate: { $lt: today } });
    if (result.deletedCount > 0) {
      console.log(`🗑️ Removed ${result.deletedCount} expired products`);
    }
  } catch (error) {
    console.error("❌ שגיאה בהסרת מוצרים שפג תוקפם:", error);
  }
}

async function sendExpiringNotifications() {
  try {
    await createExpiringProductNotifications();
  } catch (error) {
    console.error("❌ שגיאה ביצירת התראות:", error);
  }
}

async function refundShippingIfNeeded(captureId, amount) {
  if (!captureId || !amount || amount <= 0) return;
  try {
    const client = getPaypalClient();
    const req = new checkout.payments.CapturesRefundRequest(captureId);
    req.requestBody({
      amount: {
        currency_code: getCurrency(),
        value: Number(amount).toFixed(2),
      },
      note_to_payer: "Shipping refunded after converting to pickup",
    });
    await client.execute(req);
  } catch (error) {
    console.error("❌ שגיאה בזיכוי משלוח:", error);
  }
}

async function checkExpiredOrders() {
  try {
    const now = new Date();
    const expiredOrders = await Order.find({
      deliveryMethod: "delivery",
      readyForPickup: true,
      $or: [
        { courierId: { $exists: false } },
        { courierId: null },
        { courierId: "" },
      ],
      readyForPickupExpiresAt: { $lt: now, $ne: null },
    });

    for (const order of expiredOrders) {
      order.deliveryMethod = "pickup";
      order.status = "READY_FOR_PICKUP";
      order.readyForPickupExpiresAt = null;
      if (order.shippingAmount > 0 && order.paypalCaptureId) {
        await refundShippingIfNeeded(
          order.paypalCaptureId,
          order.shippingAmount
        );
        order.paymentStatus = "partially_refunded";
      }
      await order.save();
      io.to(`customer-${order.userId}`).emit("order-converted-to-pickup", {
        orderId: order._id,
      });
    }
  } catch (error) {
    console.error("❌ שגיאה בבדיקת הזמנות שפג תוקפן:", error);
  }
}

// תזמון פונקציות
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;
setInterval(removeExpiredProducts, TWENTY_FOUR_HOURS);
setInterval(sendExpiringNotifications, TWENTY_FOUR_HOURS);
setInterval(checkExpiredOrders, ONE_MINUTE);

// הרצה ראשונית
removeExpiredProducts();
sendExpiringNotifications();
checkExpiredOrders();
