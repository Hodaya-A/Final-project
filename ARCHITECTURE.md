# 🏗️ Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRESH END APPLICATION                       │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                        │
│   FRONTEND (Vue 3)        │         BACKEND (Node.js)            │
│   ├─ CartView           │         ├─ Express Server            │
│   ├─ PendingOrdersView  │         ├─ MongoDB (Orders)          │
│   └─ Dashboard          │         ├─ Nodemailer (Email)        │
│                          │         └─ Firebase Auth             │
│                          │                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│              FIREBASE (Authentication & Store Data)              │
│              MongoDB (Order Storage)                             │
│              Gmail SMTP (Email Notifications)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Order Lifecycle

```
CUSTOMER SIDE                    BACKEND                    MANAGER SIDE
═════════════════════════════════════════════════════════════════════════════

1. Browse Products
   ├─ Select store
   ├─ Add to cart (cart.shopId = store._id)
   └─ Checkout

2. Create Order
   │
   └─→ POST /api/orders
       ├─ Body: {
       │   userId,
       │   userEmail,
       │   shopId,
       │   items[],
       │   totalPrice
       │ }
       │
       └─→ Order.create()
           ├─ Status: pending_store_approval
           ├─ Save to MongoDB
           ├─ NO EMAIL SENT ✓
           └─ Return success

3. See "Thank You" page
   └─ "Awaiting store manager approval"


                                                      4. Manager Logs In
                                                         └─ Dashboard
                                                            ├─ Role check
                                                            └─ storeId loaded

                                                      5. Open Pending Orders
                                                         └─ Click red button
                                                            │
                                                            └─→ /store/pending-orders
                                                               ├─ onMounted()
                                                               ├─ fetchPendingOrders()
                                                               └─ setInterval(fetch, 10s)

                                                      6. Polling Loop (10s)
                                                         │
                                                         └─→ GET /api/orders/pending/store?shopId=ABC
                                                            ├─ Find: {shopId: ABC}
                                                            ├─ Filter: No approvedAt (pending only)
                                                            ├─ Sort: Newest first
                                                            └─ Return orders[]

                                                      7. Display Order Cards
                                                         ├─ Order ID
                                                         ├─ Time
                                                         ├─ Items
                                                         ├─ Total
                                                         └─ Approve Button

                                                      8. Manager Approves
                                                         ├─ Click "✅ אישור הזמנה"
                                                         ├─ Confirm: "אתה בטוח?"
                                                         │
                                                         └─→ POST /api/orders/approve/{orderId}
                                                            ├─ Find order
                                                            ├─ Set approvedAt = now
                                                            ├─ Save order
                                                            │
                                                            └─→ sendOrderConfirmationEmail()
                                                               ├─ Create HTML email
                                                               ├─ Add Gmail SMTP
                                                               └─→ nodemailer.sendMail()
                                                                  └─→ Gmail SMTP
                                                                     └─→ Internet

9. Alert: "✅ Order approved!"
   └─ Remove from pending list


10. Customer Checks Email
    │
    ← ← ← ← ← ← ← ← ← ← ← ← EMAIL ARRIVES ← ← ← ← ← ← ← ← ← ← ← ←
    ├─ Subject: "✅ הזמנתך אושרה"
    ├─ Order ID
    ├─ Items
    ├─ Total
    └─ "Awaiting pickup/delivery"

11. Manager Sees Updated List
    └─ Approved order removed
       (next 10-second poll)
```

## API Endpoints Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                    ORDER API ENDPOINTS                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│ POST /api/orders                                                  │
│ ├─ Purpose: Create new order (customer checkout)                │
│ ├─ Body: { userId, userEmail, shopId, items, totalPrice }     │
│ ├─ Response: { order: {...} }                                  │
│ ├─ Email sent: NO ✗                                             │
│ └─ Used by: CartView.vue                                        │
│                                                                    │
│ GET /api/orders/:userId                                          │
│ ├─ Purpose: Fetch all orders for a customer                    │
│ ├─ Response: [{ order1 }, { order2 }, ...]                    │
│ └─ Used by: MyOrdersView.vue                                    │
│                                                                    │
│ GET /api/orders/pending/store?shopId=...                       │
│ ├─ Purpose: Fetch pending orders for a specific store          │
│ ├─ Response: { orders: [...], count: N }                       │
│ ├─ Filter: !approvedAt (only pending)                          │
│ ├─ Used by: PendingOrdersView.vue (polling)                    │
│ └─ Frequency: Every 10 seconds (from manager's browser)        │
│                                                                    │
│ POST /api/orders/approve/:orderId                                │
│ ├─ Purpose: Manager approves order, triggers email             │
│ ├─ Body: { managerId (optional) }                              │
│ ├─ Actions:                                                      │
│ │  ├─ Find order                                               │
│ │  ├─ Set approvedAt = new Date()                             │
│ │  ├─ Save order                                               │
│ │  ├─ Call sendOrderConfirmationEmail()                       │
│ │  └─ Send email via Nodemailer                               │
│ ├─ Response: { success: true, order: {...} }                  │
│ ├─ Email sent: YES ✓ (to order.userEmail)                    │
│ └─ Used by: PendingOrdersView.vue (approve button)            │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Frontend Components Interaction

```
┌──────────────────────────────────────────────────────────────┐
│          FRONTEND COMPONENT HIERARCHY                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ App.vue                                                       │
│ └─ NavbarA.vue                                                │
│ └─ Router Outlet                                              │
│    │                                                          │
│    ├─→ HomeView.vue                                          │
│    │    └─ ProductList.vue                                   │
│    │       └─ ProductCard.vue (addToCart → cart.shopId)     │
│    │                                                          │
│    ├─→ CartView.vue                                          │
│    │    ├─ Read: useCartStore()                             │
│    │    ├─ Read: useUserStore()                             │
│    │    ├─ Extract: shopId from items[0]                     │
│    │    └─ Call: saveOrder(userId, email, shopId, items)   │
│    │         └─ POST /api/orders                            │
│    │              └─ No email sent                           │
│    │                                                          │
│    ├─→ ThankYouView.vue                                      │
│    │    └─ "Awaiting store manager approval"                │
│    │                                                          │
│    ├─→ StoreManagerDashboard.vue                             │
│    │    └─ Button: "🔔 הזמנות ממתינות לאישור"             │
│    │         └─ Navigate to: /store/pending-orders           │
│    │                                                          │
│    └─→ PendingOrdersView.vue ⭐                             │
│         ├─ onMounted()                                        │
│         │  ├─ fetchPendingOrders()                           │
│         │  │  └─ GET /api/orders/pending/store?shopId=...  │
│         │  └─ setInterval(10000)                             │
│         │                                                     │
│         ├─ Display: Order Cards                              │
│         │  ├─ Order ID, Time, Items, Total                  │
│         │  └─ Approve Button                                 │
│         │                                                     │
│         └─ approveOrder()                                     │
│            ├─ Confirm dialog                                 │
│            └─ POST /api/orders/approve/{orderId}            │
│               ├─ Response: order approved ✓                 │
│               ├─ Backend sends email ✓                       │
│               └─ Remove from list                            │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Data Models

```
MongoDB Order Document
────────────────────────────
{
  _id: ObjectId,
  userId: "firebase-uid",
  userEmail: "customer@example.com",  ← Used for email notification
  shopId: ObjectId,                    ← Links to store
  items: [
    {
      productId: "123",
      name: "Tomato",
      price: 5.99,
      quantity: 2,
      imageUrl: "..."
    }
  ],
  totalPrice: 11.98,
  approvedAt: null,                    ← null = pending, Date = approved
  createdAt: Date
}

Firebase User Document (Firestore)
───────────────────────────────────
{
  uid: "firebase-uid",
  email: "manager@example.com",
  role: "storeManager",
  storeId: ObjectId,                   ← Linked store
  storeName: "Green Market",
  city: "Tel Aviv",
  street: "Main St",
  number: "10"
}

Firebase Store Document (Firestore)
────────────────────────────────────
{
  _id: ObjectId (matches storeId),
  name: "Green Market",
  city: "Tel Aviv",
  street: "Main St",
  houseNumber: "10",
  managerId: "firebase-uid"
}
```

## Real-Time Polling Mechanism

```
Frontend PendingOrdersView
──────────────────────────

┌─ Component Mounts
│
├─ fetchPendingOrders() ONCE
│  └─ GET /api/orders/pending/store?shopId=ABC
│     └─ Render: Order Cards
│
├─ setInterval(() => {
│    fetchPendingOrders()
│  }, 10000)  ← Every 10 seconds
│
├─ 10s passed
│  └─ GET /api/orders/pending/store?shopId=ABC
│     └─ Compare response with current list
│        ├─ If new orders: add cards
│        ├─ If orders removed: remove cards
│        └─ Update timestamps
│
├─ User clicks Approve
│  ├─ Show confirm dialog
│  └─ If confirmed:
│     ├─ POST /api/orders/approve/{orderId}
│     ├─ Server:
│     │  ├─ Set approvedAt
│     │  ├─ Save order
│     │  └─ Send email
│     ├─ Client:
│     │  ├─ Remove from list
│     │  └─ Show success alert
│     └─ Next polling fetch won't include this order
│
└─ Component Unmounts
   └─ clearInterval() STOP POLLING
```

## Email Sending Flow

```
Manager Clicks Approve
        ↓
POST /api/orders/approve/{orderId}
        ↓
✅ Order found, marked approved
        ↓
sendOrderConfirmationEmail(order, userEmail)
        ↓
✅ Create HTML template
        │  ├─ Order ID: #ABC123
        │  ├─ Items: Tomato x2 - ₪5.99
        │  ├─ Total: ₪11.98
        │  └─ Status: Awaiting pickup/delivery
        ↓
✅ Configure Nodemailer
        │  ├─ Service: Gmail
        │  ├─ User: EMAIL_USER from .env
        │  └─ Password: EMAIL_PASSWORD from .env
        ↓
✅ Send email
        │  ├─ From: noreply@freshend.com
        │  ├─ To: customer@example.com
        │  ├─ Subject: ✅ הזמנתך אושרה
        │  └─ Body: HTML with order details
        ↓
🌐 Gmail SMTP Server
        ↓
📧 Email Delivered to Customer Inbox
        ↓
✅ Response: "Order approved and customer notified"
```

## Store Manager Authorization

```
Store Manager Login
        ↓
Firebase Auth
        ↓
userStore.initializeUser()
        ↓
Load from Firestore: users/{uid}
        ├─ uid ✓
        ├─ email ✓
        ├─ role: "storeManager" ✓
        ├─ storeId: ObjectId("...")  ← KEY
        ├─ storeName, city, street, etc.
        └─ (Load store details if missing)
        ↓
Open /store/pending-orders
        ↓
PendingOrdersView.vue
        ├─ Get shopId from: userStore.storeId
        ├─ API call: GET /pending/store?shopId={userStore.storeId}
        │  └─ Backend filters: Order.find({ shopId: userStore.storeId })
        └─ Display: Only their store's pending orders

✅ Store isolation: Each manager sees only their store's data
```

---

## Key Security Points

1. **Authentication**: Firebase Auth (via userStore)
2. **Authorization**: Check `role === 'storeManager'` before showing component
3. **Data Isolation**: Filter by `shopId` (manager's storeId)
4. **Email Validation**: Check `userEmail` exists before sending
5. **Confirmation Dialog**: Prevents accidental approvals

---

## Performance Considerations

| Component    | Optimization                                       |
| ------------ | -------------------------------------------------- |
| Polling      | 10-second interval (configurable)                  |
| API Response | Return only necessary fields (not full store data) |
| UI Updates   | Only update changed orders (Vue reactivity)        |
| Memory       | clearInterval() on unmount to prevent leaks        |
| Network      | Use query params instead of POST for GET calls     |

---

**Diagram Version**: 1.0
**Last Updated**: Current Date
**Status**: ✅ Ready for Implementation Testing
