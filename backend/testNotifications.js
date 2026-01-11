// backend/testNotifications.js
// קובץ לבדיקת מערכת ההתראות

import mongoose from "mongoose";
import "dotenv/config";
import Notification from "./models/Notification.js";
import Product from "./models/Product.js";
import Inventory from "./models/Inventory.js";
import {
  createNotificationsForNewProduct,
  createExpiringProductNotifications,
} from "./utils/notificationService.js";

// התחברות למונגו
await mongoose.connect(process.env.MONGO_URI);
console.log("✅ מחובר ל-MongoDB");

async function testCreateNotification() {
  console.log("\n🧪 בדיקה 1: יצירת התראה ידנית");

  const notification = await Notification.create({
    userId: "test-user-123",
    type: "newProduct",
    title: "מוצר חדש לבדיקה",
    message: "זהו מוצר בדיקה",
    productData: {
      name: "תפוח עץ",
      price: 5.99,
      location: {
        city: "תל אביב",
        address: "רחוב דיזנגוף 100",
      },
      distance: 500,
    },
    isRead: false,
  });

  console.log("✅ התראה נוצרה:", notification._id);
  return notification;
}

async function testFetchNotifications() {
  console.log("\n🧪 בדיקה 2: שליפת התראות");

  const notifications = await Notification.find({
    userId: "test-user-123",
  }).limit(5);

  console.log(`✅ נמצאו ${notifications.length} התראות`);
  notifications.forEach((n) => {
    console.log(`  - ${n.title} (${n.type})`);
  });
}

async function testMarkAsRead() {
  console.log("\n🧪 בדיקה 3: סימון כנקרא");

  const notification = await Notification.findOne({
    userId: "test-user-123",
    isRead: false,
  });

  if (notification) {
    notification.isRead = true;
    await notification.save();
    console.log("✅ התראה סומנה כנקראה");
  } else {
    console.log("⚠️ אין התראות שלא נקראו");
  }
}

async function testDeleteNotification() {
  console.log("\n🧪 בדיקה 4: מחיקת התראה");

  const result = await Notification.deleteOne({
    userId: "test-user-123",
  });

  console.log(`✅ נמחקו ${result.deletedCount} התראות`);
}

async function testCreateProductWithNotifications() {
  console.log("\n🧪 בדיקה 5: יצירת מוצר עם התראות אוטומטיות");

  // יצירת מוצר דוגמה
  const product = await Inventory.create({
    name: "מוצר בדיקה להתראות",
    price: 15.5,
    category: "פירות וירקות",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853], // תל אביב
    },
    place: {
      city: "תל אביב",
      address: "רחוב דיזנגוף 200",
    },
  });

  console.log("✅ מוצר נוצר:", product._id);

  // יצירת התראות
  const count = await createNotificationsForNewProduct(product);
  console.log(`✅ נוצרו ${count} התראות למשתמשים`);

  // ניקוי
  await Inventory.deleteOne({ _id: product._id });
  console.log("🧹 המוצר נמחק");
}

async function testExpiringNotifications() {
  console.log("\n🧪 בדיקה 6: התראות על מוצרים לפני פקיעה");

  const count = await createExpiringProductNotifications();
  console.log(`✅ נוצרו ${count} התראות על מוצרים לפני פקיעה`);
}

async function testUnreadCount() {
  console.log("\n🧪 בדיקה 7: ספירת התראות שלא נקראו");

  const count = await Notification.countDocuments({
    userId: "test-user-123",
    isRead: false,
  });

  console.log(`✅ יש ${count} התראות שלא נקראו`);
}

async function cleanup() {
  console.log("\n🧹 ניקוי התראות בדיקה");

  const result = await Notification.deleteMany({
    userId: "test-user-123",
  });

  console.log(`✅ נמחקו ${result.deletedCount} התראות בדיקה`);
}

// הרצת כל הבדיקות
async function runAllTests() {
  try {
    await testCreateNotification();
    await testFetchNotifications();
    await testMarkAsRead();
    await testUnreadCount();
    await testDeleteNotification();
    await testCreateProductWithNotifications();
    await testExpiringNotifications();
    await cleanup();

    console.log("\n✅ כל הבדיקות עברו בהצלחה!");
  } catch (error) {
    console.error("\n❌ שגיאה בבדיקות:", error);
  } finally {
    await mongoose.connection.close();
    console.log("👋 התנתקות מהמסד נתונים");
  }
}

runAllTests();
