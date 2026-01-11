// backend/server.js
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// routes
import inventoryRoutes from "./routes/inventory.js";
import importProfilesRoutes from "./routes/importProfiles.js";
import productRoutes from "./routes/products.js";
import reportRoutes from "./routes/reports.js";
import imagesRoutes from "./routes/images.js";
import ordersRouter from "./routes/orders.js"; // ⭐ חדש
import emailRouter from "./routes/email.js";
import geocodeRoutes from "./routes/geocode.js";
import uploadRoutes from "./routes/upload.js";
import usersRoutes from "./routes/users.js";
import notificationsRoutes from "./routes/notifications.js";

// Firebase Admin (אופציונלי)
import { auth, db } from "./config/firebaseAdmin.js";

// מודלים
import Inventory from "./models/Inventory.js";
import { createExpiringProductNotifications } from "./utils/notificationService.js";

const app = express();

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
  .then(() => console.log("✅ מחובר ל-MongoDB"))
  .catch((err) => console.error("❌ שגיאה בחיבור למונגו:", err));

/* ======================= Routes ======================= */
app.use("/api/inventory", inventoryRoutes);
app.use("/api/importProfiles", importProfilesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", imagesRoutes);

// ⭐ זה מה שהיה חסר — חיבור מודול ההזמנות
app.use("/api/orders", ordersRouter);
app.use("/api", emailRouter);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes);

/* ======================= Start Server ======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 שרת פועל על http://localhost:${PORT}`));

/* ======================= הסרה אוטומטית של מוצרים שפג תוקפם ======================= */
async function removeExpiredProducts() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // מתחיל היום

    const result = await Inventory.deleteMany({
      expiryDate: { $lt: today },
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ נמחקו ${result.deletedCount} מוצרים שפג תוקפם`);
    }
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

// הרץ כל יום בחצות
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(removeExpiredProducts, TWENTY_FOUR_HOURS);
setInterval(sendExpiringNotifications, TWENTY_FOUR_HOURS);

// הרץ מיד בהפעלת השרת
removeExpiredProducts();
sendExpiringNotifications();
