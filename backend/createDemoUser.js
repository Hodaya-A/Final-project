// backend/createDemoUser.js
// סקריפט ליצירת משתמש דוגמה עם העדפות התראות

import { db } from "./config/firebaseAdmin.js";

async function createDemoUser() {
  const userId = "demo-user-123";

  const demoUserData = {
    uid: userId,
    email: "demo@freshend.com",
    name: "משתמש דוגמה",
    role: "user",
    notificationPreferences: {
      enabled: true,
      location: {
        lat: 32.0853, // תל אביב - מרכז העיר
        lng: 34.7818,
        city: "תל אביב-יפו",
        address: "כיכר רבין, תל אביב",
      },
      maxDistance: 10000, // 10 ק"מ
      categories: ["פירות וירקות", "מוצרי חלב", "לחם ומאפים", "משקאות"],
      priceRange: {
        min: 0,
        max: 100,
      },
      onNewProducts: true,
      onDiscounts: true,
      onExpiringSoon: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await db.collection("users").doc(userId).set(demoUserData);
    console.log("✅ משתמש דוגמה נוצר בהצלחה!");
    console.log("\n📋 פרטי המשתמש:");
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${demoUserData.email}`);
    console.log(
      `   Location: ${demoUserData.notificationPreferences.location.city}`
    );
    console.log(
      `   Distance: ${
        demoUserData.notificationPreferences.maxDistance / 1000
      } ק"מ`
    );
    console.log(
      `   Categories: ${demoUserData.notificationPreferences.categories.join(
        ", "
      )}`
    );
    console.log("\n🎉 כעת תוכל להוסיף מוצרים באזור תל אביב ולקבל התראות!");
  } catch (error) {
    console.error("❌ שגיאה ביצירת משתמש:", error);
  }

  process.exit(0);
}

createDemoUser();
