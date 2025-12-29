// Quick API test
import fetch from "node-fetch";

async function testAPI() {
  try {
    const response = await fetch("http://localhost:3000/api/inventory");
    const data = await response.json();

    console.log(`✅ Total products: ${data.length}\n`);

    if (data.length > 0) {
      console.log("First 2 products:");
      data.slice(0, 2).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   Price: ₪${p.price}`);
        console.log(`   Image: ${p.imageUrl || "NO IMAGE"}`);
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAPI();
