// backend/createDemoProducts.js
// סקריפט ליצירת מוצרים לדוגמה לבדיקת מערכת ההתראות

import mongoose from "mongoose";
import "dotenv/config";
import Inventory from "./models/Inventory.js";
import { createNotificationsForNewProduct } from "./utils/notificationService.js";

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ מחובר ל-MongoDB");

const demoProducts = [
  {
    name: "תפוחי עץ אדומים",
    price: 12.9,
    priceOriginal: 15.9,
    priceDiscounted: 12.9,
    category: "פירות וירקות",
    imageUrl: "https://via.placeholder.com/200x200?text=תפוחים",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853], // תל אביב - מרכז
    },
    place: {
      city: "תל אביב-יפו",
      address: "שוק הכרמל, תל אביב",
    },
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 ימים
  },
  {
    name: "חלב טרי 3%",
    price: 5.9,
    priceOriginal: 7.9,
    priceDiscounted: 5.9,
    category: "מוצרי חלב",
    imageUrl: "https://via.placeholder.com/200x200?text=חלב",
    location: {
      type: "Point",
      coordinates: [34.775, 32.08], // תל אביב - צפון
    },
    place: {
      city: "תל אביב-יפו",
      address: "רחוב דיזנגוף 100, תל אביב",
    },
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // יומיים - לפני פקיעה!
  },
  {
    name: "לחם שיפון טרי",
    price: 8.5,
    category: "לחם ומאפים",
    imageUrl: "https://via.placeholder.com/200x200?text=לחם",
    location: {
      type: "Point",
      coordinates: [34.79, 32.09], // תל אביב - רמת אביב
    },
    place: {
      city: "תל אביב-יפו",
      address: "רמת אביב, תל אביב",
    },
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // מחר - לפני פקיעה!
  },
  {
    name: "מיץ תפוזים טבעי",
    price: 15.9,
    priceOriginal: 19.9,
    priceDiscounted: 15.9,
    category: "משקאות",
    imageUrl: "https://via.placeholder.com/200x200?text=מיץ",
    location: {
      type: "Point",
      coordinates: [34.77, 32.095], // תל אביב - צפון מזרח
    },
    place: {
      city: "תל אביב-יפו",
      address: "רחוב ארלוזורוב, תל אביב",
    },
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // שבוע
  },
  {
    name: "עגבניות שרי",
    price: 9.9,
    category: "פירות וירקות",
    imageUrl: "https://via.placeholder.com/200x200?text=עגבניות",
    location: {
      type: "Point",
      coordinates: [34.765, 32.075], // תל אביב - דרום
    },
    place: {
      city: "תל אביב-יפו",
      address: "שוק הפשפשים, יפו",
    },
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ימים
  },
];

async function createDemoProducts() {
  console.log("\n🏭 יוצר מוצרים לדוגמה...\n");

  for (const productData of demoProducts) {
    try {
      // יצירת המוצר
      const product = await Inventory.create(productData);
      console.log(`✅ נוצר: ${product.name} (${product.place.address})`);

      // יצירת התראות אוטומטית
      const notificationCount = await createNotificationsForNewProduct(product);
      console.log(`   📬 נוצרו ${notificationCount} התראות\n`);
    } catch (error) {
      console.error(`❌ שגיאה ביצירת ${productData.name}:`, error.message);
    }
  }

  console.log("\n🎉 סיימנו! נוצרו מוצרים לדוגמה עם התראות");
  console.log('\n📍 כל המוצרים באזור תל אביב (10 ק"מ מכיכר רבין)');
  console.log("💡 אם יצרת משתמש דוגמה - אמורות להיות לו התראות!");

  await mongoose.connection.close();
  console.log("\n👋 התנתקות מהמסד נתונים");
}

createDemoProducts();
