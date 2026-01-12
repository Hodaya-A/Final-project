import axios from "axios";

(async () => {
  try {
    console.log("🔍 Testing API /products...\n");
    const response = await axios.get("http://localhost:3000/api/products");

    console.log(`📦 Got ${response.data.length} products\n`);

    // Check first 3 products
    response.data.slice(0, 3).forEach((p, i) => {
      console.log(`Product ${i + 1}:`);
      console.log({
        id: p._id,
        name: p.name,
        shopId: p.shopId,
        shopIdType: typeof p.shopId,
        price: p.price,
        sellerId: p.sellerId,
      });
      console.log("");
    });

    // Check if ALL products have shopId
    const withoutShopId = response.data.filter((p) => !p.shopId);
    console.log(
      `✅ Products WITH shopId: ${response.data.length - withoutShopId.length}`
    );
    console.log(`❌ Products WITHOUT shopId: ${withoutShopId.length}`);

    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
})();
