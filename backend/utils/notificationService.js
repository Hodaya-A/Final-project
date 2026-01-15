// backend/utils/notificationService.js
import Notification from "../models/Notification.js";
import Inventory from "../models/Inventory.js";
import { db } from "../config/firebaseAdmin.js";

/**
 * יצירת התראות למשתמשים על מוצר חדש
 */
export async function createNotificationsForNewProduct(product) {
  try {
    const usersSnapshot = await db.collection("users").get();
    const notifications = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const prefs = userData.notificationPreferences;

      if (!prefs || !prefs.enabled || !prefs.onNewProducts) continue;
      if (!prefs.location || !prefs.location.lat || !prefs.location.lng)
        continue;

      if (
        !product.location ||
        !product.location.coordinates ||
        product.location.coordinates.length < 2
      ) {
        continue;
      }

      const distance = calculateDistance(
        prefs.location.lat,
        prefs.location.lng,
        product.location.coordinates[1],
        product.location.coordinates[0]
      );

      if (distance > prefs.maxDistance) continue;

      if (
        prefs.categories &&
        prefs.categories.length > 0 &&
        !prefs.categories.includes(product.category)
      ) {
        continue;
      }

      const productPrice = product.salePrice || product.price;
      if (prefs.priceRange) {
        if (prefs.priceRange.min && productPrice < prefs.priceRange.min)
          continue;
        if (prefs.priceRange.max && productPrice > prefs.priceRange.max)
          continue;
      }

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

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications.length;
  } catch (error) {
    // השארתי רק את השגיאות הקריטיות למקרה שמשהו יקרוס
    console.error("Error creating notifications:", error);
    return 0;
  }
}

/**
 * חישוב מרחק (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
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

    const expiringProducts = await Inventory.find({
      expiryDate: { $gte: today, $lte: threeDaysFromNow },
    });

    let totalNotifications = 0;

    for (const product of expiringProducts) {
      const usersSnapshot = await db.collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const prefs = userData.notificationPreferences;

        if (!prefs || !prefs.enabled || !prefs.onExpiringSoon) continue;
        if (!prefs.location || !prefs.location.lat || !prefs.location.lng)
          continue;

        if (
          !product.location ||
          !product.location.coordinates ||
          product.location.coordinates.length < 2
        ) {
          continue;
        }

        const distance = calculateDistance(
          prefs.location.lat,
          prefs.location.lng,
          product.location.coordinates[1],
          product.location.coordinates[0]
        );

        if (distance > prefs.maxDistance) continue;

        const existingNotification = await Notification.findOne({
          userId: userDoc.id,
          productId: product._id,
          type: "expiringSoon",
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        });

        if (existingNotification) continue;

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

        totalNotifications++;
      }
    }

    return totalNotifications;
  } catch (error) {
    console.error("Error creating expiring notifications:", error);
    return 0;
  }
}
