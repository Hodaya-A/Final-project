// מאפס את כל התמונות במסד הנתונים
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function resetAllImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ מחובר ל-MongoDB");

    const result = await Inventory.updateMany({}, { $set: { imageUrl: null } });

    console.log(`✅ אופסו ${result.modifiedCount} מוצרים`);
    console.log("✅ כל התמונות נמחקו מהמסד נתונים");
  } catch (error) {
    console.error("❌ שגיאה:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

resetAllImages();
