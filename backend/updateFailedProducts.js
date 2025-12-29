// סקריפט לעדכון המוצרים שנכשלו
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function updateFailedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    const ids = [
      "694aeeb3e197d307140beadf",
      "694aeeb3e197d307140beae0",
      "694aeeb3e197d307140beae1",
      "694aeeb3e197d307140beae3",
      "694aeeb3e197d307140beae4",
      "694aeeb3e197d307140beae7",
      "694aeeb3e197d307140beae8",
    ];

    for (const id of ids) {
      await Inventory.updateOne(
        { _id: id },
        { $set: { imageUrl: `/uploads/images/${id}.jpg` } }
      );
      console.log(`✅ עודכן: ${id}`);
    }

    console.log("\n✅ כל המוצרים עודכנו!");
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateFailedProducts();
