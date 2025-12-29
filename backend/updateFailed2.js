// סקריפט לעדכון המוצרים שנכשלו
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function updateFailedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    const ids = [
      "694af019e197d307140beb33",
      "694af019e197d307140beb34",
      "694af019e197d307140beb35",
      "694af019e197d307140beb36",
      "694af019e197d307140beb38",
      "694af019e197d307140beb3a",
      "694af019e197d307140beb3b",
      "694af019e197d307140beb40",
      "694af019e197d307140beb41",
      "694af019e197d307140beb42",
      "694af019e197d307140beb43",
      "694af019e197d307140beb44",
      "694af019e197d307140beb45",
      "694af019e197d307140beb49",
      "694af019e197d307140beb4d",
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
