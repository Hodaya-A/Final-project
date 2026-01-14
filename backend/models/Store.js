import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  storeId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Firebase ID of the store
  },
  name: {
    type: String,
    required: true,
  },
  city: {
    type: String,
  },
  street: {
    type: String,
  },
  houseNumber: {
    type: String,
  },
  // 💰 Commission Rate for Payment Splitting
  commissionRate: {
    type: Number,
    default: 0.15, // Default: 15% commission
    min: 0,
    max: 1, // 0 to 100%
  },
  // Additional store information
  description: {
    type: String,
  },
  logoUrl: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  bankAccount: {
    accountHolder: String,
    accountNumber: String,
    bankCode: String,
    // Add more bank details as needed
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Store", storeSchema);
