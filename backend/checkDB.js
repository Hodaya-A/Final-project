const mongoose = require("mongoose");
const Inventory = require("./models/Inventory");

mongoose
  .connect("mongodb://127.0.0.1:27017/shop-inventory")
  .then(async () => {
    console.log("✅ מחובר ל-MongoDB");

    const products = await Inventory.find({});
    console.log('סה"כ מוצרים:', products.length);

    const withSellerId = products.filter((p) => p.sellerId);
    const withoutSellerId = products.filter((p) => !p.sellerId);

    console.log("מוצרים עם sellerId:", withSellerId.length);
    console.log("מוצרים ללא sellerId:", withoutSellerId.length);

    if (withSellerId.length > 0) {
      const sellerIds = [...new Set(withSellerId.map((p) => p.sellerId))];
      console.log("\nרשימת מוכרים:");
      sellerIds.forEach((id) => {
        const count = withSellerId.filter((p) => p.sellerId === id).length;
        console.log(`  ${id}: ${count} מוצרים`);
      });
    }

    if (withoutSellerId.length > 0) {
      console.log("\nדוגמאות למוצרים ללא sellerId:");
      withoutSellerId.slice(0, 3).forEach((p) => {
        console.log(`  - ${p.name} (ID: ${p._id})`);
      });
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ שגיאה:", err);
    process.exit(1);
  });
