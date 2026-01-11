// backend/utils/notificationService.js
import Notification from "../models/Notification.js";
import Inventory from "../models/Inventory.js";
import { db } from "../config/firebaseAdmin.js";

/**
 * יצירת התראות למשתמשים על מוצר חדש
 * @param {Object} product - המוצר שנוסף
 */
export async function createNotificationsForNewProduct(product) {
  try {
    // טעינת כל המשתמשים עם העדפות התראות מופעלות
    const usersSnapshot = await db.collection("users").get();
    const notifications = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const prefs = userData.notificationPreferences;

      // בדיקה שההתראות מופעלות
      if (!prefs || !prefs.enabled || !prefs.onNewProducts) {
        continue;
      }

      // בדיקה שיש מיקום למשתמש
      if (!prefs.location || !prefs.location.lat || !prefs.location.lng) {
        continue;
      }

      // חישוב מרחק בין המשתמש למוצר
      // בדיקה שיש למוצר מיקום
      if (
        !product.location ||
        !product.location.coordinates ||
        product.location.coordinates.length < 2
      ) {
        console.log(`⚠️ מוצר ${product.name} אין לו מיקום תקין`);
        continue;
      }

      const distance = calculateDistance(
        prefs.location.lat,
        prefs.location.lng,
        product.location.coordinates[1], // lat
        product.location.coordinates[0] // lng
      );

      // בדיקה שהמוצר בטווח
      if (distance > prefs.maxDistance) {
        continue;
      }

      // בדיקת קטגוריות
      if (
        prefs.categories &&
        prefs.categories.length > 0 &&
        !prefs.categories.includes(product.category)
      ) {
        continue;
      }

      // בדיקת טווח מחירים
      const productPrice = product.salePrice || product.price;
      if (prefs.priceRange) {
        if (prefs.priceRange.min && productPrice < prefs.priceRange.min) {
          continue;
        }
        if (prefs.priceRange.max && productPrice > prefs.priceRange.max) {
          continue;
        }
      }

      // יצירת התראה למשתמש
      notifications.push({
        userId: userDoc.id,
        type: product.salePrice ? "discount" : "newProduct",
        title: product.salePrice
          ? "מבצע חדש קרוב אליך!"
          : "מוצר חדש קרוב אליך!",
        message: `${product.name} נמצא במרחק ${(distance / 1000).toFixed(
          1
        )} ק"מ ממך`,
        productId: product._id,
        productData: {
          name: product.name,
          price: productPrice,
          imageUrl: product.imageUrl,
          location: product.place,
          distance: Math.round(distance),
        },
        isRead: false,
      });
    }

    // שמירת כל ההתראות במקביל
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(
        `✅ נוצרו ${notifications.length} התראות למוצר: ${product.name}`
      );
    }

    return notifications.length;
  } catch (error) {
    console.error("Error creating notifications:", error);
    return 0;
  }
}

/**
 * חישוב מרחק בין שתי נקודות גיאוגרפיות (Haversine formula)
 * @returns מרחק במטרים
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // רדיוס כדור הארץ במטרים
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * יצירת התראות על מוצרים שעומדים לפקוע
 */
export async function createExpiringProductNotifications() {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // מציאת מוצרים שיפקעו בתוך 3 ימים
    const expiringProducts = await Inventory.find({
      expiryDate: {
        $gte: today,
        $lte: threeDaysFromNow,
      },
    });

    console.log(`🔍 מצאתי ${expiringProducts.length} מוצרים לפני פקיעה`);

    let totalNotifications = 0;

    for (const product of expiringProducts) {
      console.log(
        `\n📦 בודק מוצר: ${product.name} (${product.shopCity || "לא ידוע"})`
      );

      // טעינת משתמשים עם העדפות מתאימות
      const usersSnapshot = await db.collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const prefs = userData.notificationPreferences;

        if (!prefs || !prefs.enabled || !prefs.onExpiringSoon) {
          continue;
        }

        if (!prefs.location || !prefs.location.lat || !prefs.location.lng) {
          continue;
        }

        // בדיקה שיש למוצר מיקום תקין
        if (
          !product.location ||
          !product.location.coordinates ||
          product.location.coordinates.length < 2
        ) {
          console.log(`⚠️ מוצר ${product.name} אין לו מיקום תקין (expiring)`);
          continue;
        }

        const distance = calculateDistance(
          prefs.location.lat,
          prefs.location.lng,
          product.location.coordinates[1],
          product.location.coordinates[0]
        );

        console.log(
          `📍 מרחק ל-${product.name}: ${(distance / 1000).toFixed(
            1
          )} ק"מ (משתמש: ${userDoc.id}, מקסימום: ${
            prefs.maxDistance / 1000
          } ק"מ)`
        );

        if (distance > prefs.maxDistance) {
          console.log(`❌ מוצר רחוק מדי`);
          continue;
        }

        // בדיקה אם כבר נשלחה התראה למוצר זה למשתמש זה היום
        const existingNotification = await Notification.findOne({
          userId: userDoc.id,
          productId: product._id,
          type: "expiringSoon",
          createdAt: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
          },
        });

        if (existingNotification) {
          console.log(`⚠️ התראה כבר נשלחה היום`);
          continue;
        }

        // יצירת התראה
        await Notification.create({
          userId: userDoc.id,
          type: "expiringSoon",
          title: "⏰ מוצר לפני פקיעה במחיר מוזל!",
          message: `${product.name} יפקע בקרוב - תופס מחיר!`,
          productId: product._id,
          productData: {
            name: product.name,
            price: product.priceDiscounted || product.price,
            imageUrl: product.imageUrl,
            location: product.place,
            distance: Math.round(distance),
          },
          isRead: false,
        });

        console.log(`✅ התראה נוצרה למשתמש ${userDoc.id}`);
        totalNotifications++;
      }
    }

    console.log(`\n✅ נוצרו ${totalNotifications} התראות על מוצרים לפני פקיעה`);
    return totalNotifications;
  } catch (error) {
    console.error("Error creating expiring notifications:", error);
    return 0;
  }
}
