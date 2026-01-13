import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/**
 * GET /api/analytics/admin/earnings
 * Get total platform fees (admin earnings) for a date range
 * Query params:
 *   - startDate: ISO date string (default: first day of current month)
 *   - endDate: ISO date string (default: today)
 */
router.get("/admin/earnings", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Set defaults: current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : now;

    // Find all orders in date range and sum platformFee
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          paymentStatus: "captured", // Only count captured payments
        },
      },
      {
        $group: {
          _id: null,
          totalPlatformFee: { $sum: "$platformFee" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$totalPrice" },
        },
      },
    ]);

    const earnings = result[0] || {
      totalPlatformFee: 0,
      totalOrders: 0,
      avgOrderValue: 0,
    };

    res.json({
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      earnings: {
        total: earnings.totalPlatformFee,
        ordersCount: earnings.totalOrders,
        avgOrderValue: earnings.avgOrderValue.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error fetching admin earnings:", error);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

/**
 * GET /api/analytics/admin/earnings/daily
 * Get daily platform fees breakdown
 */
router.get("/admin/earnings/daily", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : now;

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          paymentStatus: "captured",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          dailyFee: { $sum: "$platformFee" },
          ordersCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      daily: result,
    });
  } catch (error) {
    console.error("Error fetching daily earnings:", error);
    res.status(500).json({ error: "Failed to fetch daily earnings" });
  }
});

/**
 * GET /api/analytics/store/:storeId/payout
 * Get store payout summary
 */
router.get("/store/:storeId/payout", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, status } = req.query;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : now;

    // Build match criteria
    const matchCriteria = {
      shopId: storeId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
      paymentStatus: "captured",
    };

    if (status && status !== "all") {
      matchCriteria.status = status; // Filter by order status if provided
    }

    const result = await Order.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalStorePayout: { $sum: "$storePayout" },
          totalOrders: { $sum: 1 },
          totalPlatformFee: { $sum: "$platformFee" },
        },
      },
    ]);

    const payout = result[0] || {
      totalStorePayout: 0,
      totalOrders: 0,
      totalPlatformFee: 0,
    };

    res.json({
      storeId,
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      payout: {
        total: payout.totalStorePayout,
        ordersCount: payout.totalOrders,
        platformFeeDeducted: payout.totalPlatformFee,
      },
    });
  } catch (error) {
    console.error("Error fetching store payout:", error);
    res.status(500).json({ error: "Failed to fetch payout" });
  }
});

/**
 * GET /api/analytics/store/:storeId/payout/orders
 * Get detailed list of orders and their payouts for a store
 */
router.get("/store/:storeId/payout/orders", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : now;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(
      {
        shopId: storeId,
        createdAt: { $gte: start, $lte: end },
        paymentStatus: "captured",
      },
      {
        _id: 1,
        createdAt: 1,
        totalPrice: 1,
        storePayout: 1,
        platformFee: 1,
        status: 1,
        userEmail: 1,
        items: 1,
      }
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({
      shopId: storeId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "captured",
    });

    res.json({
      storeId,
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      orders: orders.map((order) => ({
        orderId: order._id,
        date: order.createdAt,
        totalPrice: order.totalPrice,
        storePayout: order.storePayout,
        platformFee: order.platformFee,
        status: order.status,
        itemsCount: order.items?.length || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching store payout orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET /api/analytics/courier/:courierId/wallet
 * Get courier accumulated earnings (CourierPayout)
 */
router.get("/courier/:courierId/wallet", async (req, res) => {
  try {
    const { courierId } = req.params;
    const { startDate, endDate } = req.query;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : now;

    const result = await Order.aggregate([
      {
        $match: {
          courierId: courierId,
          createdAt: {
            $gte: start,
            $lte: end,
          },
          paymentStatus: "captured",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$courierPayout" },
          deliveriesCount: { $sum: 1 },
          avgEarningPerDelivery: { $avg: "$courierPayout" },
        },
      },
    ]);

    const wallet = result[0] || {
      totalEarnings: 0,
      deliveriesCount: 0,
      avgEarningPerDelivery: 0,
    };

    res.json({
      courierId,
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      wallet: {
        balance: wallet.totalEarnings,
        deliveries: wallet.deliveriesCount,
        avgPerDelivery: wallet.avgEarningPerDelivery.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error fetching courier wallet:", error);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

/**
 * GET /api/analytics/courier/:courierId/wallet/deliveries
 * Get detailed list of deliveries and earnings for a courier
 */
router.get("/courier/:courierId/wallet/deliveries", async (req, res) => {
  try {
    const { courierId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = startDate ? new Date(startDate) : firstDayOfMonth;
    const end = endDate ? new Date(endDate) : now;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Order.find(
      {
        courierId: courierId,
        createdAt: { $gte: start, $lte: end },
        paymentStatus: "captured",
      },
      {
        _id: 1,
        createdAt: 1,
        totalPrice: 1,
        courierPayout: 1,
        shippingAmount: 1,
        status: 1,
        deliveredAt: 1,
        shippingAddress: 1,
      }
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({
      courierId: courierId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "captured",
    });

    res.json({
      courierId,
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      deliveries: deliveries.map((order) => ({
        orderId: order._id,
        date: order.createdAt,
        deliveredAt: order.deliveredAt,
        shippingAmount: order.shippingAmount,
        courierPayout: order.courierPayout,
        status: order.status,
        destination: order.shippingAddress?.city || "Unknown",
      })),
    });
  } catch (error) {
    console.error("Error fetching courier deliveries:", error);
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

/**
 * POST /api/analytics/courier/:courierId/withdraw
 * Submit a withdrawal request for a courier
 * Body: { amount, bankAccount }
 */
router.post("/courier/:courierId/withdraw", async (req, res) => {
  try {
    const { courierId } = req.params;
    const { amount, bankAccount } = req.body;

    // Validation
    if (!amount || amount < 10) {
      return res.status(400).json({
        error: "סכום המינימלי לתיגבול הוא 10 שקל",
      });
    }

    if (!bankAccount || bankAccount.trim().length === 0) {
      return res.status(400).json({
        error: "חשבון בנק נדרש",
      });
    }

    // Verify courier has enough balance
    const walletResult = await Order.aggregate([
      {
        $match: {
          courierId: courierId,
          paymentStatus: "captured",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$courierPayout" },
        },
      },
    ]);

    const balance = walletResult[0]?.totalEarnings || 0;
    if (amount > balance) {
      return res.status(400).json({
        error: "סכום התיגבול עוברת את הרصיד הזמין",
        available: balance,
      });
    }

    // TODO: Create withdrawal record in database
    // For now, we'll just log it
    console.log(`💸 Withdrawal request from courier ${courierId}:`, {
      amount,
      bankAccount,
      date: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "בקשת המשיכה נשלחה בהצלחה",
      withdrawal: {
        amount,
        bankAccount,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error submitting withdrawal request:", error);
    res.status(500).json({ error: "Failed to submit withdrawal request" });
  }
});

export default router;
