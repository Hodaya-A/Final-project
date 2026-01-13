# Payment Split Calculation - Updated Implementation

## Overview

Updated the `calculatePaymentSplit` function with the exact signature and logic you specified.

## Function Signature

```javascript
calculatePaymentSplit(
  productsTotal, // Price of items (without delivery)
  (deliveryFee = 0), // Delivery/shipping fee
  (tipAmount = 0), // Courier tip from customer
  (storeCommissionRate = 0.15) // Commission rate (e.g., 0.20 for 20%)
);
```

## Calculation Logic

```
PlatformFee = productsTotal × storeCommissionRate
StorePayout = productsTotal - PlatformFee
CourierPayout = deliveryFee + tipAmount
TotalPrice = productsTotal + deliveryFee + tipAmount
```

## Return Value

```javascript
{
  platformFee: Number,      // Amount kept by platform
  storePayout: Number,      // Amount store receives
  courierPayout: Number,    // Amount courier receives
  totalPrice: Number        // Total payment amount
}
```

## Examples

### Example 1: Basic Order

```javascript
const split = calculatePaymentSplit(100, 0, 0, 0.15);
// Returns:
// {
//   platformFee: 15,      (₪100 × 15%)
//   storePayout: 85,      (₪100 - ₪15)
//   courierPayout: 0,     (₪0 + ₪0)
//   totalPrice: 100       (₪100 + ₪0 + ₪0)
// }
```

### Example 2: Order with Delivery

```javascript
const split = calculatePaymentSplit(100, 20, 0, 0.15);
// Returns:
// {
//   platformFee: 15,      (₪100 × 15%)
//   storePayout: 85,      (₪100 - ₪15)
//   courierPayout: 20,    (₪20 + ₪0)
//   totalPrice: 120       (₪100 + ₪20 + ₪0)
// }
```

### Example 3: Order with Delivery and Tip

```javascript
const split = calculatePaymentSplit(100, 20, 5, 0.15);
// Returns:
// {
//   platformFee: 15,      (₪100 × 15%)
//   storePayout: 85,      (₪100 - ₪15)
//   courierPayout: 25,    (₪20 + ₪5)
//   totalPrice: 125       (₪100 + ₪20 + ₪5)
// }
```

### Example 4: Different Commission Rate

```javascript
const split = calculatePaymentSplit(100, 0, 0, 0.2);
// Returns:
// {
//   platformFee: 20,      (₪100 × 20%)
//   storePayout: 80,      (₪100 - ₪20)
//   courierPayout: 0,     (₪0 + ₪0)
//   totalPrice: 100       (₪100 + ₪0 + ₪0)
// }
```

## Integration in Order Creation

```javascript
import { calculatePaymentSplit } from "@/backend/utils/paymentSplit.js";
import Store from "@/backend/models/Store.js";

// When creating order from PayPal capture:
const store = await Store.findOne({ storeId: shopId });
const commissionRate = store?.commissionRate || 0.15;

// Calculate split
const split = calculatePaymentSplit(
  itemsTotal, // ₪100
  shippingAmount, // ₪20
  courierTip, // ₪0
  commissionRate // 0.15
);

// Save to Order
const order = new Order({
  // ... other fields
  itemsTotal: itemsTotal,
  shippingAmount: shippingAmount,
  totalPrice: split.totalPrice,
  platformFee: split.platformFee,
  storePayout: split.storePayout,
  courierPayout: split.courierPayout,
});
```

## Additional Utility Functions

### getPaymentBreakdown()

Returns detailed breakdown with line-by-line explanation:

```javascript
const breakdown = getPaymentBreakdown(100, 20, 5, 0.15);
// breakdown.breakdown = {
//   "Products Total": 100,
//   "- Platform Fee (15%)": -15,
//   "= Store Receives": 85,
//   "Delivery Fee": 20,
//   "Courier Tip": 5,
//   "+ Courier Receives": 25,
//   "= Total Price": 130
// }
```

### getOrderPaymentBreakdown()

Works with Order objects:

```javascript
const breakdown = getOrderPaymentBreakdown(order, 0.15);
// Automatically extracts itemsTotal, shippingAmount, courierTip
```

## Validation

The function validates all inputs:

- ✅ `productsTotal > 0`
- ✅ `storeCommissionRate` between 0 and 1
- ✅ `deliveryFee >= 0`
- ✅ `tipAmount >= 0`

Throws error if validation fails.

## Testing

Run the test suite:

```bash
node backend/utils/paymentSplit.test.js
```

Tests included:

- ✅ Basic split calculation
- ✅ Split with delivery fee
- ✅ Split with tip
- ✅ Different commission rates
- ✅ High value orders
- ✅ Detailed breakdowns
- ✅ Edge cases (no commission)
- ✅ Verification that splits sum to total
- ✅ Error handling

## Files Modified

1. **`backend/utils/paymentSplit.js`** - Updated function signature and logic
2. **`backend/utils/paymentSplit.test.js`** - Updated tests for new signature
3. **`backend/routes/payments.js`** - Updated order creation to use new function

## Key Features

✅ **Clear parameter names** - No confusion about what each parameter is
✅ **Commission on products only** - Platform fee NOT charged on delivery/tip
✅ **Flexible defaults** - All parameters except productsTotal have defaults
✅ **Precise calculations** - Uses `.toFixed(2)` for currency rounding
✅ **Comprehensive validation** - Throws meaningful error messages
✅ **Detailed breakdowns** - Optional breakdown function for receipts/invoices
