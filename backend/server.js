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

// Firebase Admin (אופציונלי)
import { auth, db } from "./config/firebaseAdmin.js";

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
const geocodeRoutes = require("./routes/geocode");
app.use("/api/geocode", geocodeRoutes);

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

/* ======================= Firebase Admin ======================= */
app.delete("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    await db.collection("users").doc(uid).delete();
    await auth.deleteUser(uid);
    res.status(200).send({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: "Error deleting user" });
  }
});

app.put("/api/users/:uid/role", async (req, res) => {
  const uid = req.params.uid;
  const newRole = req.body.role;
  if (!["admin", "user"].includes(newRole)) {
    return res.status(400).send({ success: false, message: "Invalid role" });
  }
  try {
    await db.collection("users").doc(uid).update({ role: newRole });
    res.status(200).send({ success: true, message: "Role updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: "Error updating role" });
  }
});

/* ======================= Start Server ======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 שרת פועל על http://localhost:${PORT}`));
