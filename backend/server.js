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
import ordersRouter from "./routes/orders.js"; // ⭐ חדש
import paymentsRoutes from "./routes/payments.js";
import emailRouter from "./routes/email.js";
import geocodeRoutes from "./routes/geocode.js";
import uploadRoutes from "./routes/upload.js";
import usersRoutes from "./routes/users.js";
import notificationsRoutes from "./routes/notifications.js";

// Firebase Admin (אופציונלי)
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

// Make io available to routes
app.set("io", io);
app.set("db", db); // ✅ הוסף גם את Firestore DB

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
  .catch((err) => console.error("❌ שגיאה בחיבור למונגו:", err));

/* ======================= Routes ======================= */
app.use("/api/inventory", inventoryRoutes);
app.use("/api/importProfiles", importProfilesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", imagesRoutes);

// ⭐ זה מה שהיה חסר — חיבור מודול ההזמנות
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRoutes);
app.use("/api", emailRouter);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes);

/* ======================= Start Server ======================= */
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io is ready for connections`);
});

/* ======================= הסרה אוטומטית של מוצרים שפג תוקפם ======================= */
async function removeExpiredProducts() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // מתחיל היום

    const result = await Inventory.deleteMany({
      expiryDate: { $lt: today },
    });

    // שקט — אין לוגים להסרת מוצרים
  } catch (error) {
    console.error("❌ שגיאה בהסרת מוצרים שפג תוקפם:", error);
  }
}

/* ======================= יצירת התראות על מוצרים לפני פקיעה ======================= */
async function sendExpiringNotifications() {
  try {
    await createExpiringProductNotifications();
  } catch (error) {
    console.error("❌ שגיאה ביצירת התראות:", error);
  }
}

/* ======================= החזר משלוח אם בוטל ======================= */
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

// הרץ כל יום בחצות
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(removeExpiredProducts, TWENTY_FOUR_HOURS);
setInterval(sendExpiringNotifications, TWENTY_FOUR_HOURS);

// הרץ מיד בהפעלת השרת
removeExpiredProducts();
sendExpiringNotifications();
/* ======================= בדיקת הזמנות משלוח שפג תוקפן ======================= */
async function checkExpiredOrders() {
  try {
    const now = new Date();

    // מצא הזמנות שהן:
    // 1. deliveryMethod = "delivery" (משלוח)
    // 2. readyForPickup = true (מוכנות)
    // 3. אין courierId (אף שליח לא לקח)
    // 4. readyForPickupExpiresAt < now (עבר הזמן)
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
      // המר ל-איסוף עצמי
      order.deliveryMethod = "pickup";
      order.status = "READY_FOR_PICKUP";
      order.readyForPickupExpiresAt = null; // נקה את הפקיעה
      // החזר משלוח אם שולם
      if (order.shippingAmount > 0 && order.paypalCaptureId) {
        await refundShippingIfNeeded(
          order.paypalCaptureId,
          order.shippingAmount
        );
        order.paymentStatus = "partially_refunded";
      }

      await order.save();

      // Emit event to customer about pickup conversion
      io.to(`customer-${order.userId}`).emit("order-converted-to-pickup", {
        orderId: order._id,
        status: order.status,
        deliveryMethod: order.deliveryMethod,
      });

      // שלח מייל ללקוח
      try {
        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const templateId = process.env.EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          const templateParams = {
            user_email: order.userEmail,
            title: `הזמנה מס' ${order._id} - עדכון חשוב`,
            order_items: `לצערנו, לא נמצא שליח זמין עבור הזמנתך.`,
            order_total: "ההזמנה מוכנה לאיסוף עצמי מהחנות",
            order_date: new Date().toLocaleString("he-IL"),
            message: `שלום,\n\nהזמנתך מס' ${order._id} ממתינה לאיסוף בחנות.\nנא להגיע לאסוף את ההזמנה בהקדם האפשרי.\n\nתודה!`,
          };

          await emailjs.send(serviceId, templateId, templateParams, {
            publicKey: publicKey,
          });
          // שקט — אין לוגים לאחר שליחת המייל
        } else {
          console.warn("⚠️ EmailJS לא מוגדר - לא ניתן לשלוח מייל");
        }
      } catch (emailError) {
        console.error(`❌ שגיאה בשליחת מייל:`, emailError);
      }
    }

    // שקט — אין סיכומי לוגים
  } catch (error) {
    console.error("❌ שגיאה בבדיקת הזמנות שפג תוקפן:", error);
  }
}

// הרץ כל דקה
const ONE_MINUTE = 60 * 1000;
setInterval(checkExpiredOrders, ONE_MINUTE);

// הרץ מיד בהפעלת השרת
checkExpiredOrders();
