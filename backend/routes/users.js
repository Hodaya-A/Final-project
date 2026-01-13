import express from "express";
import { auth, db } from "../config/firebaseAdmin.js";
import Inventory from "../models/Inventory.js";

const router = express.Router();

function sanitizeUser(doc) {
  const data = doc.data ? doc.data() : doc;
  return {
    uid: data.uid || doc.id,
    email: data.email || "",
    name: data.name || "",
    role: data.role || "user",
    courierOptIn: data.courierOptIn || false,
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
  const {
    email,
    password,
    name = "",
    role = "user",
    courierOptIn = false,
    storeId = "",
  } = req.body;

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
      courierOptIn,
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
        courierOptIn,
        storeId,
      },
    });
  } catch (err) {
    console.error("Failed to create user", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: err.message,
    });
  }
});

// ✅ מחיקת משתמש (Auth + Firestore + מוצרים)
router.delete("/:uid", async (req, res) => {
  const uid = req.params.uid;
  try {
    // שלוף את המשתמש כדי לקבל את ה-email (sellerId) ואת ה-storeId
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    // מחק את כל המוצרים של המשתמש לפי email (sellerId)
    if (userData && userData.email) {
      const deleteResult = await Inventory.deleteMany({
        sellerId: userData.email,
      });
      console.log(
        `🗑️ נמחקו ${deleteResult.deletedCount} מוצרים של המשתמש ${userData.email}`
      );
    }

    // מחק את החנות מקולקשן stores אם קיים storeId
    if (userData && userData.storeId) {
      try {
        await db.collection("stores").doc(userData.storeId).delete();
        console.log(`🗑️ החנות ${userData.storeId} נמחקה`);
      } catch (storeErr) {
        console.error("⚠️ שגיאה במחיקת חנות:", storeErr);
      }
    }

    // מחק את המשתמש מ-Firestore
    await db.collection("users").doc(uid).delete();

    // מחק את המשתמש מ-Firebase Auth
    await auth.deleteUser(uid);

    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error deleting user" });
  }
});

// ✅ עדכון פרופיל המשתמש המחובר (PUT /api/users/me) — חייב להיות לפני /:uid
router.put("/me", async (req, res) => {
  try {
    // קבלת ה-token מה-header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "אינך מחובר למערכת" });
    }

    const token = authHeader.split("Bearer ")[1];

    // אימות ה-token וקבלת ה-UID של המשתמש
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ success: false, message: "Token לא תקין" });
    }

    const uid = decodedToken.uid;
    const { name, phone, currentPassword, newPassword } = req.body;

    // בדיקות אבטחה: אסור לשנות role או courierOptIn דרך endpoint זה
    if (req.body.role || req.body.courierOptIn !== undefined) {
      return res.status(403).json({
        success: false,
        message: "אין לך הרשאה לשנות הרשאות או תפקיד",
      });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "משתמש לא נמצא" });
    }

    // עדכון שם וטלפון
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // אם המשתמש רוצה לשנות סיסמה
    if (currentPassword && newPassword) {
      // בדיקת אורך סיסמה חדשה
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים",
        });
      }

      try {
        // עדכון סיסמה באמצעות Firebase Admin SDK
        // הערה: בסביבת ייצור מומלץ לדרוש אימות נוסף
        await auth.updateUser(uid, {
          password: newPassword,
        });
      } catch (error) {
        console.error("Error updating password:", error);
        return res.status(400).json({
          success: false,
          message: "שגיאה בעדכון הסיסמה",
        });
      }
    }

    // עדכון בפיירבייס
    if (Object.keys(updateData).length > 0) {
      await userRef.update(updateData);
    }

    return res.status(200).json({
      success: true,
      message: "הפרופיל עודכן בהצלחה",
      user: {
        uid,
        ...updateData,
      },
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({
      success: false,
      message: "שגיאה בעדכון הפרופיל",
      error: err.message,
    });
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
    return res.status(200).json({
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

// ✅ עדכון סטטוס משלוחן
router.put("/:uid/courier", async (req, res) => {
  const uid = req.params.uid;
  const courierOptIn = req.body.courierOptIn;

  if (typeof courierOptIn !== "boolean") {
    return res
      .status(400)
      .json({ success: false, message: "courierOptIn must be boolean" });
  }

  try {
    await db.collection("users").doc(uid).update({ courierOptIn });
    return res.status(200).json({
      success: true,
      message: "Courier status updated",
      user: { uid, courierOptIn },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error updating courier status" });
  }
});

export default router;
