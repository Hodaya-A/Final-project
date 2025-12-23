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
import userRoutes from "./routes/users.js";

const app = express();

/* ======================= Middleware ======================= */
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
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
app.use("/api/users", userRoutes);

/* ======================= Start Server ======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 שרת פועל על http://localhost:${PORT}`));
