import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// מוצרים עם קטגוריות שתואמות בדיוק לתפריט
const freshProducts = [
  // חלב, ביצים וסלטים
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290001001",
    name: "חלב תנובה 3%",
    category: "חלב, ביצים וסלטים",
    price: 5.9,
    priceOriginal: 6.9,
    priceDiscounted: 5.9,
    quantity: 50,
    expiryDate: new Date("2025-01-15"),
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290001002",
    name: "ביצים גודל L",
    category: "חלב, ביצים וסלטים",
    price: 12.9,
    quantity: 60,
    expiryDate: new Date("2025-01-10"),
    imageUrl:
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290001003",
    name: "קוטג' 5%",
    category: "חלב, ביצים וסלטים",
    price: 7.5,
    priceOriginal: 8.9,
    priceDiscounted: 7.5,
    quantity: 40,
    expiryDate: new Date("2025-01-20"),
    imageUrl:
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290001004",
    name: "גבינה צהובה",
    category: "חלב, ביצים וסלטים",
    price: 25.9,
    quantity: 25,
    expiryDate: new Date("2025-02-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },

  // לחם ומאפים טריים
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290002001",
    name: "לחם פרוס",
    category: "לחם ומאפים טריים",
    price: 8.9,
    quantity: 30,
    expiryDate: new Date("2025-01-05"),
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290002002",
    name: "חלה טרייה",
    category: "לחם ומאפים טריים",
    price: 12.5,
    quantity: 20,
    expiryDate: new Date("2025-01-03"),
    imageUrl:
      "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },

  // משקאות
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290003001",
    name: "מים מינרליים 1.5L",
    category: "משקאות",
    price: 3.5,
    quantity: 100,
    expiryDate: new Date("2026-01-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290003002",
    name: "קוקה קולה 1.5L",
    category: "משקאות",
    price: 6.9,
    quantity: 80,
    expiryDate: new Date("2026-06-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },

  // חטיפים ומתוקים
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290004001",
    name: "שוקולד מילקה",
    category: "חטיפים ומתוקים",
    price: 7.9,
    quantity: 50,
    expiryDate: new Date("2025-12-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290004002",
    name: "עוגיות אוראו",
    category: "חטיפים ומתוקים",
    price: 9.9,
    quantity: 40,
    expiryDate: new Date("2025-08-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },

  // קפואים
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290005001",
    name: "ירקות קפואים",
    category: "קפואים",
    price: 8.5,
    quantity: 45,
    expiryDate: new Date("2026-01-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290005002",
    name: "פיצה קפואה",
    category: "קפואים",
    price: 18.9,
    quantity: 30,
    expiryDate: new Date("2025-12-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },

  // אחזקת הבית ובע"ח
  {
    shopId: DEFAULT_SHOP_ID,
    barcode: "7290006001",
    name: "סבון כלים",
    category: 'אחזקת הבית ובע"ח',
    price: 12.9,
    quantity: 35,
    expiryDate: new Date("2027-01-01"),
    imageUrl:
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300&h=300&fit=crop",
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: { city: "תל אביב", address: "רחוב הרצל 123" },
  },
];

async function cleanAndSeed() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    // מחיקת כל המוצרים הקיימים
    const deleted = await Inventory.deleteMany({ shopId: DEFAULT_SHOP_ID });
    console.log(`🗑️  נמחקו ${deleted.deletedCount} מוצרים ישנים\n`);

    // הוספת מוצרים חדשים
    const result = await Inventory.insertMany(freshProducts);
    console.log(`✅ נוספו ${result.length} מוצרים חדשים\n`);

    // הצגת המוצרים לפי קטגוריה
    const categories = [...new Set(freshProducts.map((p) => p.category))];

    for (const category of categories) {
      const products = await Inventory.find({
        shopId: DEFAULT_SHOP_ID,
        category,
      }).select("name price");
      console.log(`\n📦 ${category}:`);
      products.forEach((p) => {
        console.log(`   • ${p.name} - ₪${p.price}`);
      });
    }

    console.log("\n\n🎉 המערכת מסודרת! כל הקטגוריות תואמות לתפריט.");
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanAndSeed();
