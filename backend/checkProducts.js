// backend/checkProducts.js
import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "./models/Inventory.js";

async function checkProducts() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/freshend"
    );

    const products = await Inventory.find().select(
      "name imageUrl price category"
    );

    products.forEach((p, i) => {});
  } catch (error) {
  } finally {
    await mongoose.disconnect();
  }
}

checkProducts();
