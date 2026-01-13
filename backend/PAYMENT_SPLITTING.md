# Payment Splitting Documentation

## Overview

This system implements payment splitting between the platform, store, and courier. Each order now tracks exactly how much each party receives.

## Database Models

### Order Model

Added three new fields to track payment distribution:

```javascript
platformFee: Number; // Commission taken by the app
storePayout: Number; // Amount the store receives
courierPayout: Number; // Amount the courier receives (delivery fee + tip)
```

### Store Model

New model that tracks store-specific commission rates:

```javascript
{
  storeId: String,          // Firebase ID (unique)
  name: String,
  city: String,
  street: String,
  houseNumber: String,
  commissionRate: Number,   // 0.15 = 15% (default)
  description: String,
  phone: String,
  email: String,
  bankAccount: {            // For future payouts
    accountHolder: String,
    accountNumber: String,
    bankCode: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Payment Split Calculation

### Formula

```
Platform Fee  = totalPrice × commissionRate
Courier Payout = shippingAmount + courierTip
Store Payout = totalPrice - platformFee - courierPayout
```

### Example (15% commission, ₪100 total, ₪20 shipping)

```
Total Price:      ₪100.00
Platform Fee (15%): ₪15.00
Shipping/Courier:  ₪20.00
─────────────────────────
Platform:         ₪15.00
Store:            ₪65.00  (100 - 15 - 20)
Courier:          ₪20.00
Total:           ₪100.00 ✓
```

## API Endpoints

### Get Store Details

```
GET /api/stores/:storeId
```

Response:

```json
{
  "storeId": "BFtHlnDALoYWDoBHCbQ8",
  "name": "Fresh End",
  "commissionRate": 0.15,
  "city": "תל אביב",
  "isActive": true,
  ...
}
```

### Create/Update Store

```
POST /api/stores/:storeId
```

Request body:

```json
{
  "name": "Fresh End",
  "city": "תל אביב",
  "commissionRate": 0.15,
  "phone": "+972-123-456",
  "bankAccount": {
    "accountHolder": "Fresh End Ltd",
    "accountNumber": "123456789",
    "bankCode": "01"
  }
}
```

### Get Commission Rate

```
GET /api/stores/:storeId/commission
```

Response:

```json
{
  "storeId": "BFtHlnDALoYWDoBHCbQ8",
  "commissionRate": 0.15
}
```

### Update Commission Rate Only

```
PATCH /api/stores/:storeId/commission
```

Request body:

```json
{
  "commissionRate": 0.15
}
```

## Utility Functions

### calculatePaymentSplit()

Calculates payment split based on total price and commission rate.

```javascript
import { calculatePaymentSplit } from "@/backend/utils/paymentSplit.js";

const split = calculatePaymentSplit(
  (totalPrice = 100),
  (commissionRate = 0.15),
  (courierDeliveryFee = 20),
  (courierTip = 0)
);

// Returns:
// {
//   platformFee: 15,
//   storePayout: 65,
//   courierPayout: 20,
//   total: 100
// }
```

### getPaymentBreakdown()

Detailed breakdown of payment distribution with line-by-line explanation.

```javascript
import { getPaymentBreakdown } from "@/backend/utils/paymentSplit.js";

const breakdown = getPaymentBreakdown(order, commissionRate);

// Returns detailed breakdown with:
// - itemsSubtotal
// - platformFee
// - storePayout
// - courierPayout
// - breakdown object with line-by-line details
```

## Integration in Payments Route

When an order is created via PayPal:

1. **Fetch store commission rate** from Store model
2. **Calculate payment split** using the commission rate
3. **Save split values** in Order document

```javascript
const paymentSplit = calculatePaymentSplit(
  total,
  commissionRate,
  shipping,
  0 // No tip from PayPal capture
);

const newOrder = new Order({
  // ... other fields
  platformFee: paymentSplit.platformFee,
  storePayout: paymentSplit.storePayout,
  courierPayout: paymentSplit.courierPayout,
});
```

## Commission Rate Management

### Default Commission Rate

- **Default**: 15% (0.15)
- When creating a store without explicit commissionRate, 15% is used

### Changing Commission Rate

Use the PATCH endpoint to update:

```bash
PATCH /api/stores/BFtHlnDALoYWDoBHCbQ8/commission
{
  "commissionRate": 0.12
}
```

## Notes

- All monetary values are stored as Numbers (can support decimals)
- Commission rates are stored as decimals (0.15 = 15%)
- Payment splits use `.toFixed(2)` for currency rounding
- When calculating splits, the platform fee is calculated first, then courier payout, then store payout gets the remainder
- Floating-point tolerance is ±0.01 (1 cent)

## Future Enhancements

1. **Automated Payouts**: Schedule weekly/monthly payouts to stores
2. **Tip Tracking**: Add tip field to Order and calculate in payout
3. **Store Analytics**: Dashboard showing commission earned vs store earnings
4. **Dynamic Commission**: Different rates for different store types
5. **Refund Handling**: Automatic refund splits back to each party
