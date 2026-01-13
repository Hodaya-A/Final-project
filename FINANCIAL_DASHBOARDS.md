# 📊 Financial Dashboards - Implementation Summary

## Overview

Three separate financial dashboards have been created for different user roles:

1. **Admin Dashboard** - Platform earnings tracking
2. **Store Owner Dashboard** - Payout tracking
3. **Courier Dashboard** - Wallet and earnings management

---

## 📋 Backend API Endpoints

### Admin Analytics

**Base Path:** `/api/analytics/admin/earnings`

#### `GET /api/analytics/admin/earnings`

Get total platform fees (admin earnings) for a date range.

**Query Parameters:**

- `startDate` (optional): ISO date string (default: first day of current month)
- `endDate` (optional): ISO date string (default: today)

**Response:**

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

#### `GET /api/analytics/admin/earnings/daily`

Get daily platform fees breakdown.

**Query Parameters:** Same as above

**Response:**

```json
{
  "period": { ... },
  "daily": [
    {
      "_id": "2024-01-01",
      "dailyFee": 100.00,
      "ordersCount": 5
    },
    ...
  ]
}
```

---

### Store Owner Analytics

**Base Path:** `/api/analytics/store/:storeId/payout`

#### `GET /api/analytics/store/:storeId/payout`

Get store payout summary.

**Query Parameters:**

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `status` (optional): Filter by order status ('all', 'pending', 'delivered', etc.)

**Response:**

```json
{
  "storeId": "store123",
  "period": { ... },
  "payout": {
    "total": 4500.00,
    "ordersCount": 75,
    "platformFeeDeducted": 750.00
  }
}
```

#### `GET /api/analytics/store/:storeId/payout/orders`

Get detailed list of orders and their payouts.

**Query Parameters:**

- `startDate` (optional)
- `endDate` (optional)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 50): Items per page

**Response:**

```json
{
  "storeId": "store123",
  "period": { ... },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  },
  "orders": [
    {
      "orderId": "order123",
      "date": "2024-01-15T10:30:00Z",
      "totalPrice": 120.00,
      "storePayout": 102.00,
      "platformFee": 18.00,
      "status": "delivered",
      "itemsCount": 3
    },
    ...
  ]
}
```

---

### Courier Analytics

**Base Path:** `/api/analytics/courier/:courierId/wallet`

#### `GET /api/analytics/courier/:courierId/wallet`

Get courier accumulated earnings (wallet balance).

**Query Parameters:**

- `startDate` (optional)
- `endDate` (optional)

**Response:**

```json
{
  "courierId": "courier123",
  "period": { ... },
  "wallet": {
    "balance": 2500.00,
    "deliveries": 50,
    "avgPerDelivery": "50.00"
  }
}
```

#### `GET /api/analytics/courier/:courierId/wallet/deliveries`

Get detailed list of deliveries and earnings.

**Query Parameters:**

- `startDate` (optional)
- `endDate` (optional)
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response:**

```json
{
  "courierId": "courier123",
  "period": { ... },
  "pagination": { ... },
  "deliveries": [
    {
      "orderId": "order123",
      "date": "2024-01-15T10:30:00Z",
      "deliveredAt": "2024-01-15T14:45:00Z",
      "shippingAmount": 35.00,
      "courierPayout": 35.00,
      "status": "delivered",
      "destination": "תל אביב"
    },
    ...
  ]
}
```

#### `POST /api/analytics/courier/:courierId/withdraw`

Submit a withdrawal request.

**Request Body:**

```json
{
  "amount": 500.0,
  "bankAccount": "123456789"
}
```

**Response:**

```json
{
  "success": true,
  "message": "בקשת המשיכה נשלחה בהצלחה",
  "withdrawal": {
    "amount": 500.0,
    "bankAccount": "123456789",
    "status": "pending",
    "createdAt": "2024-01-15T15:30:00Z"
  }
}
```

**Error Cases:**

- Minimum withdrawal amount is ₪10
- Amount cannot exceed available balance
- Bank account is required

---

## 🎨 Frontend Components

### 1. AdminEarningsDashboard.vue

**Location:** `src/components/AdminEarningsDashboard.vue`
**Route:** `/admin/earnings`

**Features:**

- ✅ Large earnings card showing total platform fees
- ✅ Statistics: order count, average order value
- ✅ Date range filtering (current month, last month, custom)
- ✅ Daily breakdown chart (bar chart using Chart.js)
- ✅ Detailed daily table with per-order data
- ✅ Responsive RTL layout with Hebrew support

**Key Elements:**

- Main earnings card with gradient background
- Interactive chart showing daily earnings
- Filterable data table
- Quick filters (current month, last month)

---

### 2. StorePayoutDashboard.vue

**Location:** `src/components/StorePayoutDashboard.vue`
**Route:** `/store/payouts`

**Features:**

- ✅ Large payout card showing store's expected payment
- ✅ Statistics: order count, platform fee deducted
- ✅ Date range filtering
- ✅ Detailed orders table with pagination
- ✅ Order status indicators (pending, confirmed, delivered, etc.)
- ✅ Platform fee visibility (so store owner understands deduction)

**Table Columns:**

- Order ID (clickable)
- Date
- Total Price
- Platform Fee (red, negative)
- Store Payout (green, bold)
- Order Status

**Pagination:**

- 20 items per page by default
- Navigate through pages

---

### 3. CourierWallet.vue

**Location:** `src/components/CourierWallet.vue`
**Route:** `/courier/wallet`

**Features:**

- ✅ Large wallet card showing available balance
- ✅ Statistics: delivery count, average per delivery
- ✅ Date range filtering (all time, current month)
- ✅ Detailed deliveries table with pagination
- ✅ Destination city display
- ✅ Withdrawal request form
- ✅ Form validation (min ₪10)
- ✅ Bank account collection

**Withdrawal Section:**

- Amount input with max validation
- Bank account field
- Minimum amount warning (₪10)
- Processing time info (2-3 business days)
- Submit button with validation

---

## 🔄 Date Filtering

All dashboards support:

- **Custom date range:** Select start and end dates
- **Quick filters:**
  - Admin: Current month, Last month
  - Store: Current month, Last month
  - Courier: All time, Current month
- **Responsive:** Filters adjust pagination and data automatically

---

## 📦 Database Queries

### Payment Split Calculation Reminder

```javascript
calculatePaymentSplit(productsTotal, deliveryFee, tipAmount, storeCommissionRate)
Returns:
{
  platformFee: productsTotal × storeCommissionRate,
  storePayout: productsTotal - platformFee,
  courierPayout: deliveryFee + tipAmount,
  totalPrice: productsTotal + deliveryFee + tipAmount
}
```

### Sample MongoDB Aggregations

**Admin Earnings (by month):**

```javascript
db.orders.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: "captured",
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
```

**Store Payouts:**

```javascript
db.orders.aggregate([
  {
    $match: {
      shopId: storeId,
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: "captured",
    },
  },
  {
    $group: {
      _id: null,
      totalStorePayout: { $sum: "$storePayout" },
      totalOrders: { $sum: 1 },
      totalPlatformFee: { $sum: "$platformFee" },
    },
  },
]);
```

**Courier Wallet:**

```javascript
db.orders.aggregate([
  {
    $match: {
      courierId: courierId,
      createdAt: { $gte: startDate, $lte: endDate },
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
```

---

## 🚀 Usage

### For Admin

1. Navigate to `/admin/earnings`
2. View total platform fees for the month
3. Use date range filter to see specific periods
4. Review daily breakdown chart and table

### For Store Owner

1. Navigate to `/store/payouts`
2. See total payout expected
3. Check platform fee deduction
4. Review individual orders and their payouts
5. Filter by date range

### For Courier

1. Navigate to `/courier/wallet`
2. See available balance
3. Review all deliveries and earnings
4. Click "בקש משיכה" (Request Withdrawal) to submit withdrawal request
5. Enter amount and bank account details

---

## 📝 Files Modified/Created

### Backend

- ✅ `backend/routes/analytics.js` - NEW (all API endpoints)
- ✅ `backend/server.js` - Modified (register analytics routes)

### Frontend

- ✅ `frontend/src/components/AdminEarningsDashboard.vue` - NEW
- ✅ `frontend/src/components/StorePayoutDashboard.vue` - NEW
- ✅ `frontend/src/components/CourierWallet.vue` - NEW
- ✅ `frontend/src/router/index.ts` - Modified (added new routes)

---

## 🎯 Next Steps (Future Enhancements)

1. **Withdrawal Model:** Create Withdrawal model to track withdrawal history
2. **Payment Integration:** Integrate with bank transfer API for actual payouts
3. **Reports Export:** Add CSV/PDF export functionality
4. **Notifications:** Notify couriers when withdrawals are processed
5. **Tax Reports:** Generate tax reports for store owners
6. **Performance Alerts:** Alert admins if earnings drop unexpectedly
7. **Refund Handling:** Track refunded orders separately from earned fees
8. **Mobile Optimization:** Enhanced mobile views for dashboards

---

## ✅ Testing Checklist

- [ ] Admin can view earnings dashboard
- [ ] Admin can filter by custom date range
- [ ] Admin chart displays correctly
- [ ] Store owner can view their payouts
- [ ] Store owner sees correct platform fee deduction
- [ ] Courier can view wallet balance
- [ ] Courier can submit withdrawal request
- [ ] Withdrawal validation works (min ₪10)
- [ ] All date filtering works correctly
- [ ] Pagination works for large datasets
- [ ] RTL layout renders correctly
- [ ] Components are responsive on mobile

---

**Implementation Date:** January 2024
**Status:** ✅ Ready for Testing
