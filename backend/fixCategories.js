import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

const DEFAULT_SHOP_ID = new mongoose.Types.ObjectId("64a000000000000000000000");

async function fixCategories() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );
    console.log("✅ מחובר למסד הנתונים\n");

    // עדכון הקטגוריות להתאמה לתפריט
    const updates = [
      { barcode: "7290000001", category: "חלב, ביצים וסלטים" },
      { barcode: "7290000002", category: "לחם ומאפים טריים" },
      { barcode: "7290000003", category: "חלב, ביצים וסלטים" },
      { barcode: "7290000004", category: "חלב, ביצים וסלטים" },
      {
        barcode: "7290000005",
        category: "חלב, ביצים וסלטים",
        name: "סלט עגבניות",
      },
      {
        barcode: "7290000006",
        category: "חלב, ביצים וסלטים",
        name: "סלט מלפפונים",
      },
      { barcode: "7290000007", category: "חלב, ביצים וסלטים" },
      { barcode: "7290000008", category: "חלב, ביצים וסלטים" },
    ];

    for (const update of updates) {
      const updateData = { category: update.category };
      if (update.name) {
        updateData.name = update.name;
      }

      const result = await Inventory.updateOne(
        { shopId: DEFAULT_SHOP_ID, barcode: update.barcode },
        { $set: updateData }
      );
      console.log(
        `✅ עודכן ${update.barcode} לקטגוריה: ${update.category}${
          update.name ? ` (${update.name})` : ""
        }`
      );
    }

    console.log("\n🎉 כל הקטגוריות עודכנו!");

    // הצגת המוצרים
    const products = await Inventory.find({ shopId: DEFAULT_SHOP_ID }).select(
      "name category"
    );
    console.log("\n📦 מוצרים במערכת:");
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - קטגוריה: ${p.category}`);
    });
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCategories();
