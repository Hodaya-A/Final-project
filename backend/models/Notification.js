// backend/models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["newProduct", "discount", "expiringSoon", "priceAlert"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    productData: {
      name: String,
      price: Number,
      imageUrl: String,
      location: {
        city: String,
        address: String,
      },
      distance: Number, // מרחק בק"מ
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000, // מחיקה אוטומטית אחרי 30 יום
    },
  },
  {
    timestamps: true,
  }
);

// אינדקס מורכב לביצועים טובים יותר
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
