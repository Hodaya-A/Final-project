import mongoose from "mongoose";
import Order from "./models/Order.js";

const mongoUri =
  process.env.MONGO_URI ||
  "mongodb+srv://freshAdmin:fgahHh9jllEPtDUM@freshend.dliqj04.mongodb.net/freshend?retryWrites=true&w=majority&appName=freshend";

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`\n📦 Total orders: ${orders.length}`);

    if (orders.length > 0) {
      console.log("\n📋 Latest orders:");
      orders.forEach((order) => {
        console.log(`\n  Order ID: ${order._id}`);
        console.log(`  User: ${order.userId}`);
        console.log(`  PayPal ID: ${order.paypalOrderId}`);
        console.log(`  Status: ${order.paymentStatus}`);
        console.log(`  Total: ${order.totalPrice}`);
        console.log(`  Created: ${order.createdAt}`);
      });
    } else {
      console.log("\n❌ No orders found in database");
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
