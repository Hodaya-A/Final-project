import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const products = await Inventory.find({}).limit(5);
    console.log("📦 Sample products from DB:");
    products.forEach((p) => {
      console.log({
        name: p.name,
        shopId: p.shopId,
        shopIdType: typeof p.shopId,
        shopIdString: p.shopId ? String(p.shopId) : undefined,
        sellerId: p.sellerId,
        price: p.price,
      });
    });

    console.log("\n📊 Total products in DB:", await Inventory.countDocuments());

    // Check for products WITHOUT shopId
    const noShopId = await Inventory.countDocuments({
      $or: [{ shopId: { $exists: false } }, { shopId: null }, { shopId: "" }],
    });
    console.log("⚠️ Products WITHOUT shopId:", noShopId);

    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
})();
