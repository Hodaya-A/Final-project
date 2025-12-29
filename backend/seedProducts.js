// backend/seedProducts.js - סקריפט להוספת מוצרים לדוגמה עם תמונות
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

const sampleProducts = [
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000001",
    name: "חלב תנובה 3%",
    category: "חלב ומוצריו",
    price: 5.9,
    priceOriginal: 6.9,
    priceDiscounted: 5.9,
    quantity: 50,
    expiryDate: new Date("2025-01-15"),
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853], // תל אביב
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000002",
    name: "לחם פרוס",
    category: "לחם ומאפים",
    price: 8.9,
    quantity: 30,
    expiryDate: new Date("2025-01-05"),
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853],
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000003",
    name: "קוטג' תנובה 5%",
    category: "חלב ומוצריו",
    price: 7.5,
    priceOriginal: 8.9,
    priceDiscounted: 7.5,
    salePrice: 7.5,
    quantity: 40,
    expiryDate: new Date("2025-01-20"),
    imageUrl:
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853],
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000004",
    name: "ביצים גודל L",
    category: "ביצים",
    price: 12.9,
    quantity: 60,
    expiryDate: new Date("2025-01-10"),
    imageUrl:
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853],
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000005",
    name: "עגבניות",
    category: "פירות וירקות",
    price: 4.9,
    quantity: 100,
    expiryDate: new Date("2025-01-02"),
    imageUrl:
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853],
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000006",
    name: "מלפפונים",
    category: "פירות וירקות",
    price: 3.9,
    quantity: 80,
    expiryDate: new Date("2025-01-03"),
    imageUrl:
      "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853],
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000007",
    name: "יוגורט יופלה",
    category: "חלב ומוצריו",
    price: 4.5,
    quantity: 70,
    expiryDate: new Date("2025-01-18"),
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853],
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290000008",
    name: "גבינה צהובה",
    category: "חלב ומוצריו",
    price: 25.9,
    priceOriginal: 29.9,
    priceDiscounted: 25.9,
    quantity: 25,
    expiryDate: new Date("2025-02-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop",
    location: {
      type: "Point",
      coordinates: [34.7818, 32.0853],
    },
    place: {
      city: "תל אביב",
      address: "רחוב הרצל 123",
    },
  },
];

async function seedProducts() {
  try {
    console.log("🔗 מתחבר למסד הנתונים...");
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים");

    // מחיקת מוצרים קיימים
    const deleteResult = await Inventory.deleteMany({});
    console.log(`🗑️ נמחקו ${deleteResult.deletedCount} מוצרים קיימים`);

    // הוספת מוצרים חדשים
    const result = await Inventory.insertMany(sampleProducts);
    console.log(`✅ נוספו ${result.length} מוצרים חדשים`);

    // הצגת המוצרים שנוספו
    console.log("\n📦 מוצרים שנוספו:");
    result.forEach((product, index) => {
      console.log(
        `${index + 1}. ${product.name} - ${product.barcode} - ₪${product.price}`
      );
      console.log(`   תמונה: ${product.imageUrl}`);
    });

    console.log("\n🎉 הנתונים נטענו בהצלחה!");
  } catch (error) {
    console.error("❌ שגיאה בטעינת הנתונים:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 ניתוק מהמסד נתונים");
  }
}

seedProducts();
