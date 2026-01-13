import mongoose from "mongoose";
import Order from "./models/Order.js";

const mongoUri = process.env.MONGO_URI;
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const order = await Order.findOne({}).sort({ createdAt: -1 });

    if (!order) {
      console.log("❌ No orders found");
      process.exit(0);
    }

    console.log("\n📦 Order Full Details:\n");
    console.log(JSON.stringify(order.toObject(), null, 2));

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
