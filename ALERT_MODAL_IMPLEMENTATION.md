# 🔔 Full-Screen Alert Modal Implementation

## ✅ What's Been Implemented

### 1. **Loud Repetitive Alert Sound** 🔊

- **File**: `frontend/src/utils/alertSound.ts`
- **Technology**: Web Audio API (no external files needed!)
- **Sound Pattern**: Phone ringing style (Israeli phone tones)
  - 933 Hz + 1394 Hz oscillators
  - ON: 500ms, OFF: 300ms, Pause: 1.2s
  - Repeats until manager clicks action button
- **Duration**: Max 30 seconds (auto-stops)
- **Volume**: 0.3 (loud, but not distorting)

### 2. **Full-Screen Modal** 📱

- **File**: `frontend/src/components/StoreOrderModal.vue`
- **Design**: Clean, typographic (NO ICONS)
- **Features**:
  - Overlays everything (z-index: 10001)
  - Shows order details:
    - Order number
    - Customer email
    - Delivery method (משלוח/איסוף עצמי)
    - Item list with quantities
    - Total price
  - Two action buttons:
    - **אשר והכן** (Approve) - Blue
    - **דחה הזמנה** (Reject) - Red outline
  - Sound STOPS when button clicked

### 3. **Real-Time Socket.IO Integration** 📡

#### Backend Changes:

- **File**: `backend/routes/payments.js`
  - Added `setSocketIO(ioInstance)` function
  - Emits `new-order` event to `shop-{shopId}` room
  - Event includes: `{ orderId, order }`
- **File**: `backend/server.js`
  - Initializes Socket.IO with payments route
  - Socket rooms: `shop-{shopId}` for store managers

#### Frontend Changes:

- **File**: `frontend/src/services/socket.ts`
  - `joinShop(shopId)` function connects to store room
  - Listens for `new-order` events
- **File**: `frontend/src/components/StoreOrderModal.vue`
  - Listens for `new-order` events via Socket.IO
  - Opens modal immediately
  - Plays alert sound
- **File**: `frontend/src/views/PendingOrdersView.vue`
  - Joins shop room on mount
  - Ensures Socket.IO is connected

### 4. **Flow Diagram**

```
Customer Pays
      ↓
PayPal Capture ✓
      ↓
Order saved to DB
      ↓
Socket.IO emit to 'shop-{shopId}'
      ↓
Store Manager gets new-order event
      ↓
StoreOrderModal opens (full-screen)
      ↓
Alert sound starts (loud phone ringing)
      ↓
Manager clicks action button
      ↓
Sound STOPS
      ↓
Order approved/rejected
```

## 🎯 Key Design Decisions

### No Icons

- Only text and typography
- Clean, professional look
- Uses semantic HTML
- Color-coded buttons (blue=approve, red=reject)

### Sound Logic

- **Starts**: Immediately when modal opens
- **Stops**: ONLY when manager clicks button
- **Web Audio API**: No MP3 files needed
- **Tone**: Professional phone-ringing (Israeli standard)

### Modal Behavior

- **Full-Screen**: Blocks everything else
- **Blur Overlay**: Dark background with blur effect
- **Responsive**: Works on desktop and tablets
- **Actions**: Two clear action buttons

## 🔧 Configuration

### Environment

- Backend: Port 3000 (Socket.IO enabled)
- Frontend: Port 5173 (Socket.IO client)
- CORS: Configured for local development

### Sound Parameters (in alertSound.ts)

```typescript
baseFreq1 = 933; // Main frequency (Hz)
baseFreq2 = 1394; // Secondary frequency (Hz)
onTime = 0.5; // Ring duration (seconds)
offTime = 0.3; // Silence duration (seconds)
pauseTime = 1.2; // Longer pause between rings
```

## 📊 Testing Checklist

- [ ] Customer pays with PayPal
- [ ] Order saved to database
- [ ] Store manager online and in pending orders view
- [ ] Modal opens full-screen immediately
- [ ] Alert sound plays (loud phone ringing)
- [ ] Sound continues repeating
- [ ] Click "אשר והכן" → Sound stops, order approved
- [ ] Click "דחה הזמנה" → Sound stops, order rejected
- [ ] Multiple orders: Each plays sound and shows modal

## 🚀 Performance Notes

- **Socket.IO**: Uses room-based targeting (shop-specific)
- **Audio**: Web Audio API is efficient
- **Modal**: Uses Vue Teleport for proper DOM placement
- **Memory**: Automatic cleanup on component unmount

## 🔐 Security Notes

- Order data passed through Socket.IO is already created in DB
- Manager can only see orders for their shop (Socket.IO room isolation)
- Approval/rejection endpoints verify shop ownership
