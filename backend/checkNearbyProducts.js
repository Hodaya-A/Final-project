// בדיקת מוצרים קרובים לבית שמש
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const beitShemeshLocation = {
  lat: 31.7457,
  lng: 34.9897,
};

async function checkNearbyProducts() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/fresh-end");
    console.log("✅ מחובר ל-MongoDB");

    // ספירת כל המוצרים
    const totalCount = await Inventory.countDocuments();
    console.log(`\n📊 סה"כ מוצרים: ${totalCount}`);

    // בדיקת מוצרים עם location
    const withLocation = await Inventory.countDocuments({
      "location.coordinates": { $exists: true, $ne: null },
    });
    console.log(`📍 מוצרים עם מיקום: ${withLocation}`);

    // מוצרים בבית שמש
    const beitShemeshProducts = await Inventory.find({
      $or: [{ place: /בית שמש/i }, { shopCity: /בית שמש/i }],
    }).limit(5);

    console.log(`\n🏠 מוצרים בבית שמש: ${beitShemeshProducts.length}`);

    if (beitShemeshProducts.length > 0) {
      console.log("\nדוגמאות:");
      beitShemeshProducts.forEach((p) => {
        console.log(`\n  📦 ${p.name}`);
        console.log(`     מחיר: ₪${p.price}`);
        console.log(`     מיקום: ${p.place || p.shopCity || "לא ידוע"}`);
        console.log(`     coordinates: ${p.location?.coordinates || "אין"}`);
        console.log(`     type: ${p.location?.type || "אין"}`);
      });
    }

    // ניסיון לחפש מוצרים קרובים עם $near
    console.log("\n\n🔍 מנסה חיפוש $near...");
    console.log(
      `מיקום בית שמש: lat=${beitShemeshLocation.lat}, lng=${beitShemeshLocation.lng}`
    );

    try {
      const nearbyProducts = await Inventory.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [beitShemeshLocation.lng, beitShemeshLocation.lat],
            },
            $maxDistance: 50000, // 50 ק"מ
          },
        },
      }).limit(5);

      console.log(`✅ נמצאו ${nearbyProducts.length} מוצרים קרובים`);

      if (nearbyProducts.length > 0) {
        console.log("\nמוצרים קרובים:");
        nearbyProducts.forEach((p) => {
          console.log(`  📦 ${p.name} - ${p.place}`);
        });
      }
    } catch (nearError) {
      console.error("❌ שגיאה בחיפוש $near:", nearError.message);

      // בדיקה אם יש אינדקס
      const indexes = await Inventory.collection.getIndexes();
      console.log("\n📑 אינדקסים קיימים:");
      Object.keys(indexes).forEach((key) => {
        console.log(`  - ${key}: ${JSON.stringify(indexes[key])}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ שגיאה:", error);
    process.exit(1);
  }
}

checkNearbyProducts();
