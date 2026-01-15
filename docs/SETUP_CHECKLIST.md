# 🎯 Setup Checklist - Real-Time Pending Orders

## ✅ Backend Setup (COMPLETE)

- [x] Added `userEmail` field to Order model
- [x] Added `approvedAt` field to Order model
- [x] Created `GET /api/orders/pending/store?shopId=...` endpoint
- [x] Created `POST /api/orders/approve/:orderId` endpoint
- [x] Integrated Nodemailer for email sending
- [x] Email sends ONLY on approval (not on order creation)
- [x] Added email configuration placeholders to .env

## ✅ Frontend Setup (COMPLETE)

- [x] Created PendingOrdersView.vue component
- [x] Added 10-second polling for real-time updates
- [x] Filter orders by shopId (manager sees only their store's orders)
- [x] Approve button with confirmation dialog
- [x] Add pending-orders route to router/index.ts
- [x] Add prominent button to StoreManagerDashboard
- [x] Updated CartView to not send email on order creation
- [x] Updated saveOrder to pass userEmail to backend

## 🔴 REQUIRED CONFIGURATION

### Email Credentials Setup

**File**: `backend/.env`

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-google-app-password
```

**Steps**:

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Replace `your-google-app-password` in .env
5. Restart backend server: `npm start`

⚠️ **IMPORTANT**: Without these credentials, emails won't send!

## 🧪 Testing Instructions

### Step 1: Start Backend

```bash
cd backend
npm start
```

Should see: `✅ Server running on port 3000`

### Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

Should see: `http://localhost:5173`

### Step 3: Test Order Creation

1. Open http://localhost:5173 in browser
2. Browse products from a store
3. Add items to cart
4. Go to cart
5. Enter valid email address
6. Click "אישור הזמנה"
7. Should see "Thank You" page
8. ✅ No email sent yet (correct behavior!)

### Step 4: Test Manager Approval

1. Login as store manager (role: 'storeManager')
2. Dashboard should show: "🔔 הזמנות ממתינות לאישור"
3. Click the red button
4. Should see pending order appear within 10 seconds
5. Click "✅ אישור הזמנה"
6. Confirm dialog: "אתה בטוח?"
7. Click OK
8. Alert: "✅ ההזמנה אושרה בהצלחה! מייל נשלח ללקוח"
9. Check customer's email inbox for order confirmation

### Step 5: Verify Real-Time Updates

1. Keep PendingOrdersView open
2. Create new order from another browser tab
3. Order should appear in pending list within 10 seconds
4. Should NOT require manual refresh

## 🔍 Verification Checklist

- [ ] Backend server runs without errors
- [ ] Frontend loads without errors
- [ ] Email credentials are in backend/.env
- [ ] Store manager can see "🔔 הזמנות ממתינות לאישור" button
- [ ] Clicking button navigates to pending orders page
- [ ] Pending orders page loads (even if empty initially)
- [ ] Creating order doesn't send email (correct behavior)
- [ ] Pending orders appear within 10 seconds of creation
- [ ] Approve button works (shows loading state)
- [ ] Email received after approval
- [ ] Order removed from pending list after approval
- [ ] Multiple stores don't see each other's orders

## 📊 Expected Behavior

| Action                                   | Expected Result                                            |
| ---------------------------------------- | ---------------------------------------------------------- |
| Customer creates order                   | Order saved, no email sent                                 |
| Manager opens pending orders             | List fetches every 10 seconds                              |
| New order created while manager watching | Order appears in ~10 seconds                               |
| Manager clicks approve                   | Confirmation dialog appears                                |
| Manager confirms                         | Order marked approved, email sent, order removed from list |
| Manager refreshes page                   | No pending orders remain                                   |
| Another manager logs in                  | Only sees their store's pending orders                     |

## 🚨 Troubleshooting

### Orders not appearing in pending list?

- Check browser console (F12) for errors
- Verify `storeId` is populated in user store
- Check that order's `shopId` matches manager's `storeId`
- Verify backend GET request is returning orders

### Email not sending?

- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify Nodemailer error logs in backend console
- Ensure Gmail App Password (not regular password)
- Check spam folder

### Polling not working?

- Check Network tab in DevTools (should see GET requests every 10s)
- Verify component mounted correctly
- Check that setInterval wasn't cleared

### Store filters not working?

- Verify manager's `storeId` is set from Firestore
- Check that orders have correct `shopId` saved
- Log both values to console to compare

## 📞 Quick Debug

**To see polling requests:**

```javascript
// Open browser DevTools (F12)
// Go to Network tab
// Filter by "pending"
// Should see GET requests every 10 seconds
```

**To check store ID:**

```javascript
// Open browser console
// Type: console.log(JSON.parse(localStorage.getItem('user')))
// Look for storeId field
```

**To check order emails:**

```bash
# Check backend logs
# Look for: "📧 Email sent successfully to..."
# Or: "❌ Failed to send email:"
```

## ✨ Success Indicators

When everything is working:

1. ✅ Manager sees pending orders on dashboard
2. ✅ New orders appear automatically (within 10 seconds)
3. ✅ Approval button works and removes order
4. ✅ Customer receives email after approval
5. ✅ Each store only sees their own orders

---

**Implementation Status**: 🟢 COMPLETE & READY FOR TESTING

Once you configure email credentials (.env), test the complete flow above.
