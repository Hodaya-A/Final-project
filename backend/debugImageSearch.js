// backend/debugImageSearch.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fetchImageFromGoogle } from "./utils/fetchImageFromGoogle.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

async function main() {
  console.log("🔍 בדיקת חיפוש תמונות\n");

  // נבדוק כמה מוצרים לדוגמה
  const testProducts = [
    { name: "במבה", barcode: "7290000000001" },
    { name: "ביסלי", barcode: "7290000000002" },
    { name: "גבינה צהובה", barcode: "7290000000003" },
  ];

  for (const product of testProducts) {
    console.log(`\n📦 ${product.name}`);
    console.log(`   ברקוד: ${product.barcode}`);

    const result = await fetchImageFromGoogle(product.name, product.barcode);

    if (result) {
      console.log(`   ✅ נמצא: ${result}`);
    } else {
      console.log(`   ⚠️  לא נמצא`);
    }
  }

  await mongoose.connection.close();
  console.log("\n✅ סיום");
}

main().catch((err) => {
  console.error("שגיאה:", err);
  process.exit(1);
});
