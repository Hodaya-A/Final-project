import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String, // ✅ כתובת מייל הלקוח לשליחת אישור
  },
  sellerId: {
    type: String,
    index: true, // ✅ מזהה המוכר (Firebase UID)
  },
  shopId: {
    type: String,
    required: true,
    index: true, // ✅ מזהה החנות (Firebase ID)
  },
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      imageUrl: String,
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  itemsTotal: {
    type: Number, // סכום הפריטים בלי משלוח
    default: 0,
  },
  shippingAmount: {
    type: Number,
    default: 0,
  },
  deliveryMethod: {
    type: String,
    enum: ["delivery", "pickup"],
    default: "delivery",
  },
  status: {
    type: String,
    enum: [
      "PENDING",
      "APPROVED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "COURIER_ASSIGNED",
      "IN_DELIVERY",
      "DELIVERED",
      "REJECTED",
      "CANCELLED",
    ],
    default: "PENDING",
    index: true,
  },
  approvedAt: {
    type: Date, // ✅ תאריך אישור על ידי מנהל
  },
  readyForPickup: {
    type: Boolean,
    default: false, // מוכן לאיסוף
  },
  readyAt: {
    type: Date, // תאריך סימון כמוכן
  },
  readyForPickupExpiresAt: {
    type: Date, // תאריך פקיעת זמן למשלוח (30 דקות)
  },
  courierId: {
    type: String, // מזהה המשלוחן (Firebase UID)
    index: true,
  },
  courierAssignedAt: {
    type: Date, // תאריך הקצאה למשלוחן
  },
  deliveredAt: {
    type: Date, // תאריך סיום המשלוח
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    zip: String,
    notes: String,
  },
  paymentStatus: {
    type: String,
    enum: [
      "pending",
      "authorized",
      "captured",
      "partially_refunded",
      "refunded",
      "failed",
    ],
    default: "captured",
  },
  paypalOrderId: {
    type: String,
  },
  paypalCaptureId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Order", orderSchema);
