// backend/routes/notifications.js
import express from "express";
import Notification from "../models/Notification.js";
import Inventory from "../models/Inventory.js";

const router = express.Router();

// ✅ קבלת כל ההתראות של משתמש
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "שגיאה בטעינת ההתראות" });
  }
});

// ✅ סימון התראה כנקראה
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "התראה לא נמצאה" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "שגיאה בעדכון ההתראה" });
  }
});

// ✅ סימון כל ההתראות כנקראו
router.put("/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ error: "שגיאה בעדכון ההתראות" });
  }
});

// ✅ מחיקת התראה
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ error: "התראה לא נמצאה" });
    }

    res.json({ success: true, message: "ההתראה נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "שגיאה במחיקת ההתראה" });
  }
});

// ✅ מחיקת כל ההתראות של משתמש
router.delete("/:userId/delete-all", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.deleteMany({ userId });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ error: "שגיאה במחיקת ההתראות" });
  }
});

// ✅ יצירת התראות למשתמשים על מוצר חדש (internal use)
router.post("/create-for-product", async (req, res) => {
  try {
    const { productId, type = "newProduct" } = req.body;

    const product = await Inventory.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "מוצר לא נמצא" });
    }

    // כאן נטען העדפות משתמשים מ-Firestore ונבדוק התאמות
    // לעכשיו נחזיר הצלחה - נממש בהמשך
    res.json({
      success: true,
      message: "התראות נוצרו בהצלחה",
      productId,
    });
  } catch (error) {
    console.error("Error creating notifications:", error);
    res.status(500).json({ error: "שגיאה ביצירת התראות" });
  }
});

// ✅ חיפוש מוצרים קרובים ויצירת התראות
router.post("/check-nearby-products", async (req, res) => {
  try {
    const { userId, location, maxDistance = 10000, categories = [] } = req.body;

    console.log("🔍 בדיקת מוצרים קרובים:", {
      userId,
      location,
      maxDistance,
      categories,
    });

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ error: "חסר מיקום תקין" });
    }

    // שאילתת $near למוצרים קרובים - מחפשים ב-Inventory
    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [location.lng, location.lat], // [lng, lat] - GeoJSON format
          },
          $maxDistance: maxDistance, // במטרים
        },
      },
    };

    // אם יש סינון לפי קטגוריות
    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }

    console.log("🔎 מחפש מוצרים עם שאילתה:", JSON.stringify(query, null, 2));

    const nearbyProducts = await Inventory.find(query).limit(20);
    console.log(`📦 נמצאו ${nearbyProducts.length} מוצרים קרובים`);

    // יצירת התראות למוצרים חדשים
    const notifications = nearbyProducts.map((product) => {
      // חישוב מרחק מדויק
      const distance = calculateDistance(
        location.lat,
        location.lng,
        product.location?.coordinates[1] || 0,
        product.location?.coordinates[0] || 0
      );

      return {
        userId,
        type: "newProduct",
        title: "מוצר קרוב אליך!",
        message: `${product.name} נמצא במרחק ${(distance / 1000).toFixed(
          1
        )} ק"מ ממך`,
        productId: product._id,
        productData: {
          name: product.name,
          price: product.priceDiscounted || product.price,
          imageUrl: product.imageUrl,
          location: product.place,
          distance: Math.round(distance),
        },
        isRead: false,
      };
    });

    // שמירת ההתראות
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ נוצרו ${notifications.length} התראות חדשות`);
    }

    res.json({
      success: true,
      foundProducts: nearbyProducts.length,
      notificationsCreated: notifications.length,
    });
  } catch (error) {
    console.error("Error checking nearby products:", error);
    res.status(500).json({ error: "שגיאה בחיפוש מוצרים קרובים" });
  }
});

// פונקציית עזר לחישוב מרחק (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // רדיוס כדור הארץ במטרים
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default router;
