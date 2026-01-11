# 🔔 Real-Time Pending Orders Implementation Guide

## Overview

Implemented a complete real-time order approval system where store managers can view pending orders in real-time and approve them, triggering email notifications to customers.

## ✅ What's Been Implemented

### Backend (Node.js + Express)

#### 1. **Order Model** (`backend/models/Order.js`)

```javascript
- userId: String (customer ID)
- userEmail: String (customer email for notifications)
- shopId: ObjectId (links to the store)
- items: Array (order items with name, quantity, price)
- totalPrice: Number
- approvedAt: Date (timestamp when manager approved)
- createdAt: Date (order creation timestamp)
```

#### 2. **Order API Endpoints** (`backend/routes/orders.js`)

**POST `/api/orders`** - Create new order

- Body: `{ userId, userEmail, shopId, items, totalPrice }`
- Status: `pending_store_approval`
- Does NOT send email yet

**GET `/api/orders/:userId`** - Fetch user's orders

- Returns all orders for a specific user

**GET `/api/orders/pending/store?shopId=...`** - Fetch pending orders for a store

- Filters by shopId
- Returns only orders that haven't been approved yet
- Used by store managers to see what needs approval

**POST `/api/orders/approve/:orderId`** - Manager approves order

- Sets `approvedAt` timestamp
- Sends email confirmation to customer
- Returns success response

#### 3. **Email Service** (Built into orders.js)

- Uses Nodemailer with Gmail SMTP
- Sends HTML email when order is approved (NOT on creation)
- Email includes:
  - Order ID
  - Item list
  - Total price
  - Status update

### Frontend (Vue 3 + TypeScript)

#### 1. **PendingOrdersView Component** (`frontend/src/views/PendingOrdersView.vue`)

- **Real-time polling**: Fetches pending orders every 10 seconds
- **Filters by store**: Only shows orders for logged-in manager's store (via `storeId`)
- **Order cards** showing:
  - Order ID (last 6 chars)
  - Time created
  - Item list
  - Total price
- **Approve button**: With loading state and confirmation dialog
- **Animated transitions**: Cards slide in smoothly
- **Status indicators**: Loading, error, and empty states

Key features:

```typescript
// 10-second polling interval
pollInterval = setInterval(() => {
  fetchPendingOrders();
}, 10000);

// Filters by store
const shopId = userStore.storeId;

// Immediate UI update on approval
pendingOrders.value = pendingOrders.value.filter((o) => o._id !== orderId);
```

#### 2. **Router Configuration** (`frontend/src/router/index.ts`)

Added route:

```typescript
{
  path: '/store/pending-orders',
  name: 'pending-orders',
  component: () => import('@/views/PendingOrdersView.vue'),
  meta: { requiresAuth: true, roles: ['storeManager'] }
}
```

#### 3. **StoreManagerDashboard** (`frontend/src/views/store-manager/StoreManagerDashboard.vue`)

Added prominent red button:

```vue
<button class="urgent" @click="goTo('/store/pending-orders')">
  🔔 הזמנות ממתינות לאישור
</button>
```

- Red background (#e74c3c) with glow effect
- First button on dashboard for visibility
- Routes to `/store/pending-orders`

#### 4. **CartView Refactored** (`frontend/src/views/CartView.vue`)

- Removed email sending on order creation
- Now passes `userEmail` to backend via `saveOrder()`
- Email sent ONLY after manager approves

#### 5. **Order Service Updated** (`frontend/src/services/orders.ts`)

```typescript
saveOrder(userId: string, userEmail: string, shopId: string, items: CartItem[], totalPrice: number)
```

- Passes `userEmail` to backend
- Removes prior email handling

#### 6. **User Store** (`frontend/src/stores/user.ts`)

- Has `storeId` field populated from Firestore
- Used by PendingOrdersView to filter orders

## 🔧 Configuration Required

### Email Setup (.env file)

Add to `backend/.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-google-app-password
```

**To get Gmail App Password:**

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Paste into `.env` file

## 📊 Data Flow

```
Customer Order Created
    ↓
POST /api/orders
    ↓
Order saved with status: pending_store_approval
    ↓
NO EMAIL SENT YET ✓
    ↓
Manager opens /store/pending-orders
    ↓
GET /api/orders/pending/store?shopId=123
    ↓
Shows pending orders (polls every 10 sec)
    ↓
Manager clicks "Approve"
    ↓
POST /api/orders/approve/{orderId}
    ↓
Order.approvedAt = now
Order saved
    ↓
sendOrderConfirmationEmail() → Nodemailer → Gmail
    ↓
✅ EMAIL SENT TO CUSTOMER
    ↓
Order removed from pending list
    ↓
Alert: "Order approved! Email sent to customer"
```

## 🎯 User Experience

**For Customers:**

1. Add items to cart from their store
2. Click checkout
3. Provide email
4. See "Thank you" page
5. **Wait for manager approval** (pending_store_approval)
6. **Receive email ONLY after manager approves**

**For Store Managers:**

1. Login as store manager
2. Open dashboard
3. Click red button: "🔔 הזמנות ממתינות לאישור"
4. See list of pending orders (updates every 10 seconds)
5. Click "✅ אישור הזמנה" to approve
6. Confirm dialog appears
7. Email automatically sent to customer
8. Order disappears from pending list
9. See success message

## 🔍 Key Implementation Details

### Why Polling Instead of WebSocket?

- ✅ Simpler to implement (no Socket.io setup needed)
- ✅ Works with current backend (Express.js)
- ✅ 10-second interval is acceptable for MVP
- ✅ Can upgrade to WebSocket later if needed

### Why shopId Instead of storeOwnerId?

- ✅ Already exists in Inventory collection
- ✅ Simpler schema (no duplicate fields)
- ✅ Direct reference to store document
- ✅ Consistent with existing product structure

### Why Email on Approval, Not on Order?

- ✅ User requested: "תשלח מייל רק אחרי שהמנהל חנות אישר"
- ✅ Prevents spam emails if order is incorrect
- ✅ Reduces bounce rates (customer confirmed to get email)
- ✅ Aligns with business workflow

## 🧪 Testing Checklist

- [ ] Create order as customer with valid email
- [ ] Verify order appears in manager's pending orders view within 10 seconds
- [ ] Click approve button on order
- [ ] Confirm dialog appears
- [ ] Check that email credentials are configured in .env
- [ ] Verify email received by customer
- [ ] Confirm order disappears from pending list
- [ ] Refresh page and verify order stays gone (persistence)
- [ ] Test with multiple stores (each manager sees only their store's orders)
- [ ] Test email content (includes order ID, items, price)

## 📱 Performance Considerations

**Current polling (10 seconds):**

- ~8,640 requests per day per manager
- Acceptable for MVP
- Could optimize to longer intervals as users prefer

**To improve performance:**

1. **Increase polling interval** to 30 seconds (less frequent, but still responsive)
2. **WebSocket upgrade** (true real-time, lower bandwidth)
3. **Pagination** (only fetch first 10-20 orders)
4. **Caching** (client-side cache with invalidation)

## 🚀 Future Enhancements

1. **Sound notification** when new order arrives
2. **Push notifications** (Web Push API or mobile push)
3. **Auto-refresh on focus** (pause polling when tab not visible)
4. **Order statistics** (orders/hour, approval time, etc.)
5. **Batch operations** (approve multiple orders)
6. **Order filters** (by time, by customer, by price range)
7. **Mobile app** (React Native or Flutter)

## 🐛 Troubleshooting

**Manager doesn't see pending orders:**

- Verify `userStore.storeId` is populated from Firestore
- Check browser console for errors
- Verify backend is running on port 3000
- Check MongoDB connection in .env

**Email not sending:**

- Verify EMAIL_USER and EMAIL_PASSWORD in .env
- Check that Gmail App Password is used (not regular password)
- Enable "Less secure app access" if using regular Gmail password
- Check backend console logs for Nodemailer errors

**Orders not updating in real-time:**

- Check network tab in DevTools (should see GET requests every 10 seconds)
- Verify polling interval didn't get cleared
- Check component lifecycle (onMounted/onUnmounted)

## 📚 Files Modified/Created

**Backend:**

- ✅ `backend/models/Order.js` - Added userEmail, approvedAt fields
- ✅ `backend/routes/orders.js` - Added pending/store endpoint, approve endpoint, email function
- ✅ `backend/.env` - Added EMAIL_USER and EMAIL_PASSWORD placeholders

**Frontend:**

- ✅ `frontend/src/views/PendingOrdersView.vue` - NEW COMPONENT
- ✅ `frontend/src/router/index.ts` - Added pending-orders route
- ✅ `frontend/src/views/store-manager/StoreManagerDashboard.vue` - Added pending orders button
- ✅ `frontend/src/views/CartView.vue` - Removed email sending, pass userEmail to backend
- ✅ `frontend/src/services/orders.ts` - Updated saveOrder signature

## 📝 Notes

- Order status field could be added for more granular tracking (pending_store_approval, ready_for_pickup, etc.)
- Consider adding retry logic for email sending
- Future: Add order history for managers to see approved orders
- Future: Add manager comments/notes to orders
- Hebrew UI is complete and right-to-left (RTL) compatible

---

**Status**: ✅ READY FOR TESTING
**Next Step**: Configure email credentials and test the complete flow
