import express from "express";
import checkout from "@paypal/checkout-server-sdk";
import Order from "../models/Order.js";
import { getPaypalClient, getCurrency } from "../utils/paypalClient.js";

const router = express.Router();

function formatPaypalError(error) {
  const status = error?.statusCode || error?.status || 500;
  const name = error?.name || error?.message || "PayPal error";
  const details = error?.message || error?.toString?.();
  const debugId = error?.headers?.["paypal-debug-id"] || error?.debug_id;
  return { status, name, details, debugId };
}

function calcItemsTotal(items = []) {
  return items.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || 0);
    return sum + price * qty;
  }, 0);
}

router.post("/create", async (req, res) => {
  try {
    const {
      items = [],
      deliveryMethod = "delivery",
      shippingAmount = 0,
      currency,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items are required" });
    }

    const client = getPaypalClient();
    const currencyCode = currency || getCurrency();
    const itemsTotal = calcItemsTotal(items);
    const shipping =
      deliveryMethod === "delivery" ? Number(shippingAmount || 0) : 0;
    const total = itemsTotal + shipping;

    const ppItems = items.map((item) => ({
      name: item.name || "Item",
      quantity: String(item.quantity || 1),
      unit_amount: {
        currency_code: currencyCode,
        value: Number(item.price || 0).toFixed(2),
      },
    }));

    const request = new checkout.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currencyCode,
                value: itemsTotal.toFixed(2),
              },
              shipping: {
                currency_code: currencyCode,
                value: shipping.toFixed(2),
              },
            },
          },
          items: ppItems,
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING", // כתובת נאספת מהטופס אצלנו
      },
    });

    const order = await client.execute(request);
    const approvalLink = order.result?.links?.find(
      (l) => l.rel === "approve"
    )?.href;

    res.json({
      id: order.result.id,
      approveUrl: approvalLink,
      itemsTotal,
      shipping,
      total,
      currency: currencyCode,
    });
  } catch (error) {
    const err = formatPaypalError(error);
    console.error("❌ PayPal create error:", err, error);
    res
      .status(500)
      .json({ error: "Failed to create PayPal order", paypal: err });
  }
});

router.post("/capture", async (req, res) => {
  try {
    console.log(
      "💳 [Backend] /capture called with req.body keys:",
      Object.keys(req.body)
    );
    console.log("💳 [Backend] Items from request:", req.body.items);

    const {
      paypalOrderId,
      userId,
      userEmail,
      shopId,
      sellerId,
      items = [],
      deliveryMethod = "delivery",
      shippingAddress = {},
      shippingAmount = 0,
    } = req.body;

    console.log("💳 [Backend] Destructured values:", {
      paypalOrderId: !!paypalOrderId,
      userId,
      userEmail,
      shopId,
      sellerId,
      itemsCount: items.length,
      firstItemShopId: items[0]?.shopId,
      firstItemFull: items[0],
      deliveryMethod,
      shippingAmount,
    });

    if (!paypalOrderId) {
      return res.status(400).json({ error: "paypalOrderId is required" });
    }
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!shopId && !items?.[0]?.shopId) {
      return res
        .status(400)
        .json({ error: "shopId is required (missing in request/items)" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items are required" });
    }

    const client = getPaypalClient();
    const currencyCode = getCurrency();
    const itemsTotal = calcItemsTotal(items);
    const shipping =
      deliveryMethod === "delivery" ? Number(shippingAmount || 0) : 0;
    const total = itemsTotal + shipping;

    const captureRequest = new checkout.orders.OrdersCaptureRequest(
      paypalOrderId
    );
    captureRequest.requestBody({});
    const capture = await client.execute(captureRequest);

    const captureId =
      capture.result?.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";
    const status = capture.result?.status || "UNKNOWN";

    // Map PayPal status to our Order enum: COMPLETED → captured
    let paymentStatus = "captured";
    if (status === "COMPLETED") {
      paymentStatus = "captured";
    } else if (status === "APPROVED" || status === "CREATED") {
      paymentStatus = "authorized";
    } else if (status.toLowerCase() === "pending") {
      paymentStatus = "pending";
    }

    const productShopId = items[0]?.shopId || shopId || "DEFAULT";
    const productSellerId = items[0]?.sellerId || sellerId || "DEFAULT";

    // ✅ וודא שזה תמיד string ולא ObjectId
    const finalShopId = String(productShopId);
    const finalSellerId = String(productSellerId);

    console.log("💾 [Payment] Creating order with:", {
      userId,
      userEmail,
      shopId: finalShopId,
      sellerId: finalSellerId,
      itemsCount: items.length,
      firstItemShopId: items[0]?.shopId,
      firstItemSellerId: items[0]?.sellerId,
      requestShopId: shopId,
      requestSellerId: sellerId,
    });

    const newOrder = new Order({
      userId,
      userEmail,
      shopId: finalShopId,
      sellerId: finalSellerId,
      items,
      totalPrice: total,
      deliveryMethod,
      approvedAt: null,
      readyForPickup: false,
      readyAt: null,
      readyForPickupExpiresAt: null,
      courierId: null,
      courierAssignedAt: null,
      deliveredAt: null,
      shippingAddress,
      shippingAmount: shipping,
      itemsTotal,
      paymentStatus,
      paypalOrderId,
      paypalCaptureId: captureId,
    });

    await newOrder.save();

    // DEBUG: לוג זמני כדי לבדוק מה נשמר
    console.log("✅ PayPal order saved:", {
      orderId: newOrder._id,
      shopId: newOrder.shopId,
      sellerId: newOrder.sellerId,
      userId: newOrder.userId,
      readyForPickup: newOrder.readyForPickup,
      approvedAt: newOrder.approvedAt,
    });

    res.json({
      success: true,
      order: newOrder,
      paypalStatus: status,
      paypalCaptureId: captureId,
    });
  } catch (error) {
    const err = formatPaypalError(error);
    console.error("❌ PayPal capture error:", err, error);
    res
      .status(500)
      .json({ error: "Failed to capture PayPal order", paypal: err });
  }
});

export default router;
