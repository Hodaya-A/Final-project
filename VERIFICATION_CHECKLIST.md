# ✅ Financial Dashboards - Verification Checklist

## Pre-Deployment Verification

### 1. Backend Setup ✓

- [x] Created `backend/routes/analytics.js` with 7 endpoints
- [x] Registered route in `backend/server.js`
- [x] Endpoints use MongoDB aggregation for data retrieval
- [x] All endpoints filter by `paymentStatus: "captured"`
- [x] Date defaults set to current month
- [ ] Test each endpoint manually
- [ ] Verify MongoDB queries return correct data
- [ ] Test error handling (invalid dates, missing IDs)

### 2. Frontend Setup ✓

- [x] Created `AdminEarningsDashboard.vue`
- [x] Created `StorePayoutDashboard.vue`
- [x] Created `CourierWallet.vue`
- [x] Added routes to `frontend/src/router/index.ts`
- [x] Added `chart.js` to dependencies
- [ ] Run `npm install` in frontend directory
- [ ] Verify all imports resolve
- [ ] Check console for missing dependencies
- [ ] Test each dashboard loads without errors

### 3. Database Verification

- [ ] Verify Order model has all required fields:
  - `platformFee` (Number, default 0)
  - `storePayout` (Number, default 0)
  - `courierPayout` (Number, default 0)
  - `paymentStatus` (String, "captured")
  - `createdAt` (Date)
  - `shopId` (String)
  - `courierId` (String)
- [ ] Check that existing orders have these fields populated
- [ ] If needed, run migration to backfill data
- [ ] Verify indexes on `createdAt`, `shopId`, `courierId` for performance

### 4. API Testing

#### Admin Endpoints

```bash
# Test admin earnings summary
curl "http://localhost:3000/api/analytics/admin/earnings?startDate=2024-01-01&endDate=2024-01-31"

# Expected: { period, earnings: { total, ordersCount, avgOrderValue }}

# Test admin daily breakdown
curl "http://localhost:3000/api/analytics/admin/earnings/daily?startDate=2024-01-01&endDate=2024-01-31"

# Expected: { period, daily: [{ _id, dailyFee, ordersCount }, ...] }
```

- [ ] Summary endpoint returns data
- [ ] Daily endpoint returns data
- [ ] Date filtering works
- [ ] Calculations are correct

#### Store Endpoints

```bash
# Test store payout summary
curl "http://localhost:3000/api/analytics/store/STORE_ID/payout?startDate=2024-01-01&endDate=2024-01-31"

# Test store orders detail
curl "http://localhost:3000/api/analytics/store/STORE_ID/payout/orders?page=1&limit=20"
```

- [ ] Summary endpoint returns correct store data
- [ ] Orders endpoint returns paginated data
- [ ] Platform fee deduction is visible
- [ ] Order count matches database

#### Courier Endpoints

```bash
# Test courier wallet
curl "http://localhost:3000/api/analytics/courier/COURIER_ID/wallet"

# Test courier deliveries
curl "http://localhost:3000/api/analytics/courier/COURIER_ID/wallet/deliveries?page=1&limit=20"

# Test withdrawal request
curl -X POST "http://localhost:3000/api/analytics/courier/COURIER_ID/withdraw" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "bankAccount": "123456789"}'
```

- [ ] Wallet endpoint returns balance
- [ ] Deliveries endpoint returns list
- [ ] Withdrawal endpoint validates input
- [ ] Minimum amount (₪10) enforced
- [ ] Balance validation works

### 5. Frontend Testing

#### Admin Dashboard (`/admin/earnings`)

- [ ] Page loads without errors
- [ ] Large earnings card displays
- [ ] Date filter buttons work
- [ ] Current month button sets correct dates
- [ ] Last month button sets correct dates
- [ ] Date picker inputs work
- [ ] Data loads when dates change
- [ ] Chart renders (bar chart)
- [ ] Table displays daily breakdown
- [ ] Currency formatting correct (₪)
- [ ] RTL layout correct

#### Store Dashboard (`/store/payouts`)

- [ ] Page loads without errors
- [ ] Large payout card displays
- [ ] Correct store data shown (storeId from userStore)
- [ ] Platform fee deduction visible
- [ ] Orders table displays
- [ ] Status badges show correct colors
- [ ] Pagination controls work
- [ ] Page navigation works
- [ ] Date filtering works
- [ ] Currency formatting correct

#### Courier Dashboard (`/courier/wallet`)

- [ ] Page loads without errors
- [ ] Wallet card shows balance
- [ ] Delivery count correct
- [ ] Average per delivery calculated
- [ ] Deliveries table displays
- [ ] Pagination works
- [ ] Date filtering works
- [ ] Withdrawal form displays
- [ ] Amount input has max validation
- [ ] Amount input has min (₪10)
- [ ] Bank account field required
- [ ] Submit button disabled until valid
- [ ] Form submission works

### 6. Data Validation

#### Payment Split Calculation

Using the formula: `calculatePaymentSplit(productsTotal, deliveryFee, tipAmount, storeCommissionRate)`

- [ ] Platform Fee = productsTotal × storeCommissionRate
- [ ] Store Payout = productsTotal - platformFee
- [ ] Courier Payout = deliveryFee + tipAmount
- [ ] Total = productsTotal + deliveryFee + tipAmount

Example:

```
productsTotal: 100
deliveryFee: 10
tipAmount: 5
storeCommissionRate: 0.15

Expected:
platformFee: 15 (100 × 0.15)
storePayout: 85 (100 - 15)
courierPayout: 15 (10 + 5)
totalPrice: 115 (100 + 10 + 5)
```

- [ ] Verify calculations match database values
- [ ] Check monthly totals
- [ ] Verify daily breakdown sums to monthly

### 7. Security & Permissions

- [ ] Admin can only see admin dashboard
- [ ] Store owner can only see their own store data
- [ ] Courier can only see their own wallet data
- [ ] Role-based access control working
- [ ] Authentication required for all endpoints
- [ ] Invalid store/courier IDs return 403/404

### 8. Performance Testing

- [ ] Admin earnings loads in < 1 second
- [ ] Store payouts loads in < 1 second
- [ ] Courier wallet loads in < 1 second
- [ ] Large datasets (1000+ orders) still perform well
- [ ] Pagination handling large datasets efficiently
- [ ] No N+1 queries in MongoDB

### 9. Error Handling

- [ ] Invalid date format handled gracefully
- [ ] Missing courier/store ID returns error
- [ ] Withdrawal with invalid amount shows error
- [ ] Withdrawal with amount > balance shows error
- [ ] Database connection errors handled
- [ ] Network errors display user-friendly message

### 10. Browser Compatibility

- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)
- [ ] RTL rendering correct in all browsers
- [ ] Charts render in all browsers

### 11. Responsive Design

- [ ] Desktop (1920px) layout correct
- [ ] Tablet (768px) layout correct
- [ ] Mobile (375px) layout correct
- [ ] Touch interactions work on mobile
- [ ] Date picker usable on mobile
- [ ] Tables scroll horizontally on mobile

### 12. Localization

- [ ] All Hebrew text displays correctly
- [ ] RTL direction applied
- [ ] Date format correct (DD/MM/YYYY)
- [ ] Currency symbol (₪) displays correctly
- [ ] Number formatting correct (2 decimals)

### 13. Documentation

- [ ] `FINANCIAL_DASHBOARDS.md` complete
- [ ] `DASHBOARDS_SETUP.md` complete
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Database schema documented
- [ ] Examples provided

### 14. Installation Instructions

Before deployment, run:

```bash
# Backend - no new dependencies needed
cd backend
npm install  # already has all needed packages

# Frontend - add chart.js
cd frontend
npm install  # installs chart.js from package.json
```

### 15. Launch Checklist

- [ ] All 3 components created
- [ ] All 7 API endpoints implemented
- [ ] Routes registered in server.js and router
- [ ] chart.js added to dependencies
- [ ] Database has test orders with payment splits
- [ ] All endpoints tested and return data
- [ ] All dashboard components load
- [ ] All features work as expected
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation complete
- [ ] User instructed on how to access dashboards

---

## Test Data Setup

Before testing, ensure you have test orders with payment splits:

```javascript
// In your order creation code, ensure:
const order = new Order({
  totalPrice: 115,
  itemsTotal: 100,
  shippingAmount: 10,
  platformFee: 15, // 100 × 0.15
  storePayout: 85, // 100 - 15
  courierPayout: 15, // 10 + 5
  paymentStatus: "captured",
  shopId: "store123",
  courierId: "courier456",
  createdAt: new Date(),
});
```

---

## Deployment Steps

1. **Code Review**

   - [ ] All 3 components reviewed
   - [ ] Analytics route reviewed
   - [ ] No console.log() left in production code
   - [ ] Error handling comprehensive

2. **Database**

   - [ ] Backup production database
   - [ ] Verify Order model has all fields
   - [ ] Run migration if needed for existing orders
   - [ ] Create indexes for performance

3. **Backend Deployment**

   - [ ] Deploy `backend/routes/analytics.js`
   - [ ] Update `backend/server.js` with route registration
   - [ ] Restart backend server
   - [ ] Test all endpoints return data

4. **Frontend Deployment**

   - [ ] Run `npm install` to install chart.js
   - [ ] Build frontend: `npm run build`
   - [ ] Deploy built files
   - [ ] Clear browser cache
   - [ ] Test in staging environment

5. **Verification**
   - [ ] All dashboards accessible
   - [ ] All data loading correctly
   - [ ] All features working
   - [ ] No errors in production

---

## Rollback Plan

If issues occur:

1. **Immediate Rollback:**

   ```bash
   # Remove analytics route from server.js
   # Remove route definitions from router
   # Redeploy frontend/backend
   ```

2. **Database:**

   - No changes made to data schema
   - Safe to rollback frontend/backend only

3. **Data Integrity:**
   - No data modified by analytics endpoints
   - Read-only queries only
   - Safe to keep in place

---

## Post-Deployment Monitoring

- [ ] Monitor error logs for analytics endpoint errors
- [ ] Check performance metrics (response times)
- [ ] Verify data accuracy (compare with manual calculations)
- [ ] Monitor user adoption (page views)
- [ ] Collect user feedback
- [ ] Watch for edge cases (missing data, etc.)

---

**Status:** Ready for Testing
**Last Updated:** January 2024
**Next Review:** After first week of production
