import express from "express";
import { auth, db } from "../config/firebaseAdmin.js";

const router = express.Router();

function sanitizeUser(doc) {
  const data = doc.data ? doc.data() : doc;
  return {
    uid: data.uid || doc.id,
    email: data.email || "",
    name: data.name || "",
    role: data.role || "user",
    storeId: data.storeId || "",
    createdAt: data.createdAt
      ? data.createdAt.toDate
        ? data.createdAt.toDate()
        : data.createdAt
      : null,
  };
}

// ✅ קבלת כל המשתמשים (למנהל)
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => sanitizeUser(doc));
    return res.json({ users });
  } catch (err) {
    console.error("Failed to list users", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to list users" });
  }
});

// ✅ יצירת משתמש חדש (ע"י אדמין) — הסיסמה לא מוחזרת ללקוח
router.post("/", async (req, res) => {
  const { email, password, name = "", role = "user", storeId = "" } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }
  const allowedRoles = ["admin", "user", "storeManager"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name || undefined,
    });

    const uid = userRecord.uid;
    const userData = {
      uid,
      email,
      name,
      role,
      storeId,
      createdAt: new Date(),
    };

    await db.collection("users").doc(uid).set(userData);
    return res.status(201).json({
      success: true,
      user: {
        uid,
        email,
        name,
        role,
        storeId,
      },
    });
  } catch (err) {
    console.error("Failed to create user", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to create user",
        error: err.message,
      });
  }
});

// ✅ מחיקת משתמש (Auth + Firestore)
router.delete("/:uid", async (req, res) => {
  const uid = req.params.uid;
  try {
    await db.collection("users").doc(uid).delete();
    await auth.deleteUser(uid);
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error deleting user" });
  }
});

// ✅ עדכון תפקיד משתמש
router.put("/:uid/role", async (req, res) => {
  const uid = req.params.uid;
  const newRole = req.body.role;
  const allowedRoles = ["admin", "user", "storeManager"];

  if (!allowedRoles.includes(newRole)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  try {
    await db.collection("users").doc(uid).update({ role: newRole });
    return res
      .status(200)
      .json({
        success: true,
        message: "Role updated",
        user: { uid, role: newRole },
      });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error updating role" });
  }
});

export default router;
