# 🎯 Financial Dashboards - Quick Setup Guide

## What Was Built

You now have **3 complete financial dashboards** for your platform:

### 1️⃣ Admin Dashboard: "כמה הרווחנו החודש" (How much we earned this month)

- **Route:** `/admin/earnings`
- **Shows:** Total platform fees collected
- **Features:** Graph, daily breakdown table, date filtering

### 2️⃣ Store Owner Dashboard: "כמה כסף אקבל בסוף החודש" (How much money will I get)

- **Route:** `/store/payouts`
- **Shows:** What stores will receive (after platform fees)
- **Features:** Order-by-order breakdown, pagination, status tracking

### 3️⃣ Courier Dashboard: "הארנק שלי" (My Wallet)

- **Route:** `/courier/wallet`
- **Shows:** Courier earnings and available balance
- **Features:** Delivery list, withdrawal requests, earnings stats

---

## Implementation Status

### ✅ Backend (Complete)

- **File:** `backend/routes/analytics.js`
- **Endpoints Created:**
  - `/api/analytics/admin/earnings` - GET (summary)
  - `/api/analytics/admin/earnings/daily` - GET (daily breakdown)
  - `/api/analytics/store/:storeId/payout` - GET (summary)
  - `/api/analytics/store/:storeId/payout/orders` - GET (detailed)
  - `/api/analytics/courier/:courierId/wallet` - GET (summary)
  - `/api/analytics/courier/:courierId/wallet/deliveries` - GET (detailed)
  - `/api/analytics/courier/:courierId/withdraw` - POST (withdrawal request)
- **Integrated:** Added to `server.js` via `app.use("/api/analytics", analyticsRoutes)`

### ✅ Frontend (Complete)

- **Components Created:**
  - `src/components/AdminEarningsDashboard.vue`
  - `src/components/StorePayoutDashboard.vue`
  - `src/components/CourierWallet.vue`
- **Routes Added:**
  - `/admin/earnings` → AdminEarningsDashboard
  - `/store/payouts` → StorePayoutDashboard
  - `/courier/wallet` → CourierWallet
- **Features:** RTL support, date filtering, charts, tables, pagination, form validation

---

## How to Use

### Testing Admin Earnings

```bash
# 1. Start backend server
cd backend && npm start

# 2. Start frontend
cd frontend && npm run dev

# 3. Login as admin
# Navigate to: http://localhost:5173/admin/earnings

# 4. You should see:
# - Large earnings card with ₪ amount
# - Date filter controls
# - Daily earnings chart
# - Detailed breakdown table
```

### Testing Store Payouts

```bash
# 1. Login as store manager
# 2. Navigate to: http://localhost:5173/store/payouts

# You should see:
# - Expected payment card
# - Orders table with detailed breakdown
# - Platform fee deduction shown clearly
```

### Testing Courier Wallet

```bash
# 1. Login as courier
# 2. Navigate to: http://localhost:5173/courier/wallet

# You should see:
# - Available balance card
# - List of deliveries with earnings
# - Withdrawal request form
# - Enter amount and bank account to request payout
```

---

## Data Flow

### Payment Data Collection

1. Customer makes purchase and pays via PayPal ✓ (Already implemented)
2. Order created with payment split fields:
   - `platformFee`: Amount earned by platform
   - `storePayout`: Amount to be paid to store
   - `courierPayout`: Amount to be paid to courier
3. Data stored in Order model ✓ (Already implemented)

### Dashboard Data Retrieval

1. User navigates to dashboard
2. Frontend calls analytics API
3. Backend aggregates Order data (MongoDB aggregation pipeline)
4. Returns summary + detailed breakdown
5. Frontend displays with charts and tables

### Withdrawal Flow

1. Courier submits withdrawal request via form
2. Frontend calls POST endpoint with amount + bank account
3. Backend validates:
   - Amount ≥ ₪10
   - Amount ≤ available balance
   - Bank account provided
4. Request stored (TODO: create Withdrawal model)
5. Admin processes through banking system

---

## Key Data Points

### What Each Dashboard Tracks

**Admin Earnings:**

- Total `platformFee` sum for date range
- Order count
- Average order value
- Daily breakdown with trend

**Store Payouts:**

- Total `storePayout` sum
- Per-order breakdown
- Platform fee deduction shown
- Order status tracking

**Courier Wallet:**

- Total `courierPayout` sum
- Delivery count
- Average earnings per delivery
- Withdrawal history (future)

---

## API Response Examples

### Admin Earnings Response

```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "earnings": {
    "total": 1500.0,
    "ordersCount": 45,
    "avgOrderValue": "33.33"
  }
}
```

### Store Payout Response

```json
{
  "storeId": "store123",
  "payout": {
    "total": 4500.0,
    "ordersCount": 75,
    "platformFeeDeducted": 750.0
  }
}
```

### Courier Wallet Response

```json
{
  "courierId": "courier123",
  "wallet": {
    "balance": 2500.0,
    "deliveries": 50,
    "avgPerDelivery": "50.00"
  }
}
```

---

## Important Notes

### Date Filtering

- **Default:** Current month only
- **Admin:** Can also select "Current Month" or "Last Month"
- **Format:** ISO date strings (YYYY-MM-DD)
- **Timezone:** Uses server timezone (UTC)

### Payment Status Filter

- Only shows orders with `paymentStatus: "captured"`
- Prevents counting pending or failed payments
- Ensures accurate revenue reporting

### Pagination

- Store and Courier tables paginate by default (20 items per page)
- Admin can request daily breakdown for any date range

### Currency Display

- All amounts shown with ₪ symbol
- Formatted to 2 decimal places
- Right-to-left (RTL) layout for Hebrew

---

## Troubleshooting

### "Failed to fetch earnings"

- Check backend server is running
- Verify `/api/analytics` route is registered in `server.js`
- Check MongoDB connection

### "No data showing"

- Ensure orders exist in database
- Verify `paymentStatus: "captured"` on test orders
- Check date range includes your test orders

### Chart not rendering

- Ensure `chart.js` is installed in frontend
- Check browser console for JS errors
- Verify canvas element has proper dimensions

### Withdrawal form not submitting

- Check all fields are filled
- Amount must be ≥ ₪10
- Amount must be ≤ available balance

---

## Future Enhancements

### Phase 2: Withdrawal Management

- [ ] Create `Withdrawal` model
- [ ] Track withdrawal history
- [ ] Add withdrawal status tracking (pending → processed → paid)
- [ ] Send notifications when processed

### Phase 3: Advanced Reporting

- [ ] CSV/PDF export
- [ ] Tax report generation
- [ ] Earnings trends/projections
- [ ] Performance metrics per store
- [ ] Courier performance rankings

### Phase 4: Payment Integration

- [ ] Automated bank transfers
- [ ] Payment scheduling
- [ ] Multi-currency support
- [ ] Refund handling

---

## Testing Checklist

Before deploying to production:

### Backend Tests

- [ ] All 7 API endpoints return data
- [ ] Date filtering works correctly
- [ ] Pagination works (20 items per page)
- [ ] Aggregation calculations are correct
- [ ] Error handling works (invalid dates, missing courier, etc.)

### Frontend Tests

- [ ] All 3 dashboards load without errors
- [ ] Date pickers work
- [ ] Charts render properly
- [ ] Tables display data correctly
- [ ] Pagination works
- [ ] RTL layout is correct
- [ ] Mobile responsive

### Data Validation Tests

- [ ] Platform fees match calculated amounts
- [ ] Store payouts = total - platform fee
- [ ] Courier payouts = delivery fee + tip
- [ ] Daily totals match monthly total
- [ ] No data shows for future dates
- [ ] Historical data accessible

---

## Support & Debugging

### Enable Detailed Logging

In `backend/routes/analytics.js`, add:

```javascript
console.log("Query params:", { startDate, endDate });
console.log("Match criteria:", matchCriteria);
console.log("Aggregation result:", result);
```

### Check Database Directly

```javascript
// In MongoDB shell
db.orders.find({ paymentStatus: "captured" }).limit(5);
db.orders.aggregate([
  { $match: { createdAt: { $gte: new Date("2024-01-01") } } },
  { $group: { _id: null, total: { $sum: "$platformFee" } } },
]);
```

### Frontend Console Debugging

```javascript
// In browser console
fetch("/api/analytics/admin/earnings")
  .then((r) => r.json())
  .then((d) => console.log(d));
```

---

**Status:** ✅ Ready for Testing  
**Implementation Date:** January 2024  
**Documentation:** See `FINANCIAL_DASHBOARDS.md` for complete API reference
