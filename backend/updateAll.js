// סקריפט לעדכון מוצרים
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function updateAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    const ids = [
      "69028303df1f3bbcffb8747e",
      "6910708fb973119d5980b89f",
      "694af019e197d307140beb31",
      "694af019e197d307140beb32",
      "694af019e197d307140beb34",
      "694af019e197d307140beb35",
      "694af019e197d307140beb36",
      "694af019e197d307140beb38",
      "694af019e197d307140beb3a",
      "694af019e197d307140beb3b",
      "694af019e197d307140beb3c",
      "694af019e197d307140beb3d",
      "694af019e197d307140beb3e",
      "694af019e197d307140beb40",
      "694af019e197d307140beb42",
      "694af019e197d307140beb43",
      "694af019e197d307140beb45",
      "694af019e197d307140beb46",
      "694af019e197d307140beb47",
      "694af019e197d307140beb49",
      "694af019e197d307140beb4a",
      "694af019e197d307140beb4b",
      "694af019e197d307140beb4c",
      "694af019e197d307140beb4e",
    ];

    for (const id of ids) {
      await Inventory.updateOne(
        { _id: id },
        { $set: { imageUrl: `/uploads/images/${id}.jpg` } }
      );
      console.log(`✅ ${id}`);
    }

    console.log("\n✅ סיום!");
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateAll();
