/**
 * Calculate payment split between platform, store, and courier
 * @param {number} productsTotal - Price of items (without delivery)
 * @param {number} deliveryFee - Delivery/shipping fee
 * @param {number} tipAmount - Courier tip from customer
 * @param {number} storeCommissionRate - Store commission rate (e.g., 0.20 for 20%)
 * @returns {Object} Object with platformFee, storePayout, courierPayout, totalPrice
 *
 * @example
 * const split = calculatePaymentSplit(100, 20, 5, 0.15)
 * // Returns: {
 * //   platformFee: 15,      (100 * 0.15)
 * //   storePayout: 85,      (100 - 15)
 * //   courierPayout: 25,    (20 + 5)
 * //   totalPrice: 130       (100 + 20 + 5)
 * // }
 */
export function calculatePaymentSplit(
  productsTotal,
  deliveryFee = 0,
  tipAmount = 0,
  storeCommissionRate = 0.15
) {
  // Validate inputs
  if (productsTotal <= 0) {
    throw new Error("Products total must be greater than 0");
  }

  if (storeCommissionRate < 0 || storeCommissionRate > 1) {
    throw new Error("Commission rate must be between 0 and 1");
  }

  if (deliveryFee < 0) {
    throw new Error("Delivery fee cannot be negative");
  }

  if (tipAmount < 0) {
    throw new Error("Tip amount cannot be negative");
  }

  // Calculate platform fee (commission on products only, NOT on delivery)
  const platformFee = parseFloat(
    (productsTotal * storeCommissionRate).toFixed(2)
  );

  // Store payout = products total - platform fee
  const storePayout = parseFloat((productsTotal - platformFee).toFixed(2));

  // Courier payout = delivery fee + tip
  const courierPayout = parseFloat((deliveryFee + tipAmount).toFixed(2));

  // Total price = products + delivery + tip
  const totalPrice = parseFloat(
    (productsTotal + deliveryFee + tipAmount).toFixed(2)
  );

  // Verify the math adds up (with floating point tolerance)
  const sum = parseFloat(
    (platformFee + storePayout + courierPayout).toFixed(2)
  );
  if (Math.abs(sum - totalPrice) > 0.01) {
    console.warn(
      `Payment split may have rounding issues. Total: ${totalPrice}, Sum: ${sum}`
    );
  }

  return {
    platformFee,
    storePayout,
    courierPayout,
    totalPrice,
  };
}

/**
 * Detailed payment split with breakdown - useful for invoices/receipts
 * @param {number} productsTotal - Price of items (without delivery)
 * @param {number} deliveryFee - Delivery/shipping fee
 * @param {number} tipAmount - Courier tip from customer
 * @param {number} storeCommissionRate - Store commission rate
 * @returns {Object} Detailed breakdown of payments with line-by-line explanation
 *
 * @example
 * const breakdown = getPaymentBreakdown(100, 20, 5, 0.15)
 * // breakdown.breakdown will show:
 * // {
 * //   "Products Total": 100,
 * //   "- Platform Fee (15%)": -15,
 * //   "= Store Receives": 85,
 * //   "Delivery Fee": 20,
 * //   "Courier Tip": 5,
 * //   "+ Courier Receives": 25,
 * //   "= Total Price": 130
 * // }
 */
export function getPaymentBreakdown(
  productsTotal,
  deliveryFee = 0,
  tipAmount = 0,
  storeCommissionRate = 0.15
) {
  // Use the main calculation function
  const split = calculatePaymentSplit(
    productsTotal,
    deliveryFee,
    tipAmount,
    storeCommissionRate
  );

  const commissionPercent = (storeCommissionRate * 100).toFixed(0);

  return {
    productsTotal,
    deliveryFee,
    tipAmount,
    storeCommissionRate,
    ...split, // Includes platformFee, storePayout, courierPayout, totalPrice
    breakdown: {
      "Products Total": productsTotal,
      [`- Platform Fee (${commissionPercent}%)`]: -split.platformFee,
      "= Store Receives": split.storePayout,
      "Delivery Fee": deliveryFee,
      "Courier Tip": tipAmount,
      "+ Courier Receives": split.courierPayout,
      "= Total Price": split.totalPrice,
    },
  };
}

/**
 * Compatibility function for Order objects
 * @param {Object} order - Order object with itemsTotal, shippingAmount, courierTip
 * @param {number} commissionRate - Store commission rate
 * @returns {Object} Payment split with breakdown
 */
export function getOrderPaymentBreakdown(order, commissionRate = 0.15) {
  const productsTotal = order.itemsTotal || 0;
  const deliveryFee = order.shippingAmount || 0;
  const tipAmount = order.courierTip || 0;

  return getPaymentBreakdown(
    productsTotal,
    deliveryFee,
    tipAmount,
    commissionRate
  );
}
