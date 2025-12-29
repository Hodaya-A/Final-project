import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

// מוצרים עם ברקודים אמיתיים מישראל
const realProducts = [
  // חלב, ביצים וסלטים
  {
    name: "חלב תנובה 3% 1 ליטר",
    barcode: "7290000126630",
    category: "חלב, ביצים וסלטים",
    price: 5.9,
    quantity: 50,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
  {
    name: "ביצים L תנובה 12 יח'",
    barcode: "7290000066684",
    category: "חלב, ביצים וסלטים",
    price: 12.9,
    quantity: 30,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
  {
    name: "קוטג' 5% תנובה 250 גרם",
    barcode: "7290000066882",
    category: "חלב, ביצים וסלטים",
    price: 6.5,
    quantity: 40,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
  {
    name: "גבינה צהובה עמק 200 גרם",
    barcode: "7290000067438",
    category: "חלב, ביצים וסלטים",
    price: 25.9,
    quantity: 25,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },

  // לחם ומאפים
  {
    name: "לחם פרוס אנג'ל 750 גרם",
    barcode: "7290016665888",
    category: "לחם ומאפים טריים",
    price: 7.9,
    quantity: 20,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
  {
    name: "חלה משפחתית אנג'ל",
    barcode: "7290102950836",
    category: "לחם ומאפים טריים",
    price: 9.9,
    quantity: 15,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },

  // משקאות
  {
    name: "מים מינרליים נביעות הגולן 1.5 ליטר",
    barcode: "7290000068817",
    category: "משקאות",
    price: 3.9,
    quantity: 100,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
  {
    name: "קוקה קולה 1.5 ליטר",
    barcode: "5449000000996",
    category: "משקאות",
    price: 6.9,
    quantity: 60,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },

  // חטיפים ומתוקים
  {
    name: "שוקולד מילקה 100 גרם",
    barcode: "7622300489809",
    category: "חטיפים ומתוקים",
    price: 7.5,
    quantity: 50,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
  {
    name: "עוגיות אוראו 154 גרם",
    barcode: "7622210688507",
    category: "חטיפים ומתוקים",
    price: 8.9,
    quantity: 40,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },

  // קפואים
  {
    name: "ירקות קפואים תנובה 800 גרם",
    barcode: "7290000066929",
    category: "קפואים",
    price: 12.9,
    quantity: 30,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
  {
    name: "פיצה משפחתית גרנדה 400 גרם",
    barcode: "7290110330675",
    category: "קפואים",
    price: 19.9,
    quantity: 20,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },

  // אחזקת הבית
  {
    name: 'פיירי נוזל כלים לימון 750 מ"ל',
    barcode: "8001090037428",
    category: 'אחזקת הבית ובע"ח',
    price: 10.5,
    quantity: 35,
    location: { type: "Point", coordinates: [34.7818, 32.0853] },
    place: "תל אביב",
  },
];

async function seedWithRealBarcodes() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    // מחיקת מוצרים קיימים
    await Inventory.deleteMany({ shopId: DEFAULT_SHOP_ID });
    console.log("🗑️  נוקו מוצרים קודמים\n");

    // הוספת מוצרים עם ברקודים אמיתיים
    const productsToInsert = realProducts.map((p) => ({
      ...p,
      shopId: DEFAULT_SHOP_ID,
      imageUrl: "/placeholder.jpg", // יעודכן בסקריפט הבא
    }));

    await Inventory.insertMany(productsToInsert);

    console.log("=".repeat(60));
    console.log(`✅ נוספו ${realProducts.length} מוצרים עם ברקודים אמיתיים!`);
    console.log("=".repeat(60));

    console.log("\nמוצרים:");
    realProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   ברקוד: ${p.barcode}`);
      console.log(`   קטגוריה: ${p.category}\n`);
    });
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedWithRealBarcodes();
