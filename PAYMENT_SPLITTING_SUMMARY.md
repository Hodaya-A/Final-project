# Payment Splitting Implementation Summary

## Files Created/Modified

### Models (Backend)

1. **`backend/models/Order.js`** ✏️ MODIFIED

   - Added: `platformFee` (Number)
   - Added: `storePayout` (Number)
   - Added: `courierPayout` (Number)

2. **`backend/models/Store.js`** ✨ NEW
   - New Store entity with commission rate support
   - Fields: storeId, name, city, street, houseNumber, **commissionRate**, bankAccount details

### Utilities (Backend)

3. **`backend/utils/paymentSplit.js`** ✨ NEW

   - `calculatePaymentSplit()` - Basic payment split calculation
   - `getPaymentBreakdown()` - Detailed breakdown with explanations

4. **`backend/utils/paymentSplit.test.js`** ✨ NEW
   - 9 comprehensive test cases
   - Edge cases and error handling tests
   - Run with: `node backend/utils/paymentSplit.test.js`

### Routes (Backend)

5. **`backend/routes/stores.js`** ✨ NEW

   - `GET /api/stores/:storeId` - Get store details
   - `POST /api/stores/:storeId` - Create/update store
   - `GET /api/stores/:storeId/commission` - Get commission rate
   - `PATCH /api/stores/:storeId/commission` - Update commission rate

6. **`backend/routes/payments.js`** ✏️ MODIFIED
   - Now imports Store model and payment split utilities
   - Fetches store commission rate when creating order
   - Calculates and saves payment split values

### Server

7. **`backend/server.js`** ✏️ MODIFIED
   - Imported `storesRoutes`
   - Added route mounting: `app.use("/api/stores", storesRoutes)`

### Documentation

8. **`backend/PAYMENT_SPLITTING.md`** ✨ NEW
   - Complete documentation with examples
   - API endpoint specifications
   - Integration guide

## Key Features

### Payment Calculation Logic

```
Platform Fee = totalPrice × commissionRate
Courier Payout = shippingAmount + courierTip
Store Payout = totalPrice - platformFee - courierPayout
```

### Default Commission Rate

- **15%** (0.15) - applied to all new stores
- Can be updated per-store using PATCH endpoint

### Example Calculation

For a ₪100 order with 15% commission and ₪20 shipping:

- Platform Fee: ₪15.00 (15%)
- Store Payout: ₪65.00
- Courier Payout: ₪20.00
- **Total: ₪100.00** ✓

## API Usage Examples

### Get Store Commission

```bash
curl GET http://localhost:3000/api/stores/BFtHlnDALoYWDoBHCbQ8/commission
```

### Create/Update Store

```bash
curl -X POST http://localhost:3000/api/stores/BFtHlnDALoYWDoBHCbQ8 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh End",
    "city": "Tel Aviv",
    "commissionRate": 0.15,
    "bankAccount": {
      "accountHolder": "Fresh End Ltd",
      "accountNumber": "123456789"
    }
  }'
```

### Update Commission Only

```bash
curl -X PATCH http://localhost:3000/api/stores/BFtHlnDALoYWDoBHCbQ8/commission \
  -H "Content-Type: application/json" \
  -d '{"commissionRate": 0.12}'
```

## Testing

Run the payment split tests:

```bash
node backend/utils/paymentSplit.test.js
```

Output will show:

- ✓ 9 test cases passing
- Edge cases verification
- Error handling confirmation

## Next Steps (Optional Enhancements)

1. **Automated Payouts** - Schedule weekly/monthly store payouts
2. **Refund Handling** - Handle refunds with split reversal
3. **Analytics Dashboard** - Show commission vs store earnings
4. **Dynamic Rates** - Different commission rates by store type
5. **Audit Trail** - Log all payment calculations for compliance

## Integration Points

### Order Creation (PayPal Route)

When order is created:

1. Fetch store's commission rate
2. Calculate payment split using the rate
3. Save platformFee, storePayout, courierPayout in Order

### Future Order Status Changes

- Mark as delivered → trigger store payout
- Process refund → reverse payment splits
- Assign courier → confirm courier payout

## Data Integrity

✓ All calculations use `.toFixed(2)` for currency precision
✓ Floating-point tolerance: ±0.01 (1 cent)
✓ Validation: Commission rate must be 0-1 (0-100%)
✓ Error handling: Non-positive amounts throw errors

## Database Migrations

If using existing orders collection, add script to migrate:

```javascript
db.orders.updateMany(
  { platformFee: { $exists: false } },
  {
    $set: {
      platformFee: 0,
      storePayout: 0,
      courierPayout: 0,
    },
  }
);
```
