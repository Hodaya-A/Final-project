# 🔔 מערכת התראות חכמות - Fresh End

## תיאור המערכת

מערכת התראות מתקדמת ומותאמת אישית המאפשרת למשתמשים לקבל עדכונים על מוצרים חדשים, מבצעים ומוצרים לפני פקיעה באזור הגיאוגרפי שלהם.

## תכונות עיקריות

### התראות מותאמות אישית

- **מיקום גיאוגרפי**: התראות על מוצרים במרחק מוגדר מהמשתמש
- **סינון קטגוריות**: בחירת קטגוריות מוצרים מועדפות
- **טווח מחירים**: קבלת התראות רק על מוצרים בטווח מחירים רצוי
- **סוגי התראות**: בחירה בין מוצרים חדשים, מבצעים, ומוצרים לפני פקיעה

### חישוב מרחק אינטליגנטי

- שימוש באלגוריתם Haversine לחישוב מרחק מדויק
- תמיכה ב-Geospatial queries עם MongoDB
- אינדקס 2dsphere לביצועים מיטביים

### התראות אוטומטיות

- יצירת התראות אוטומטיות בעת הוספת מוצר חדש
- התראות יומיות על מוצרים לפני פקיעה
- מניעת התראות כפולות באותו היום

### ממשק משתמש מתקדם

- מרכז התראות עם תצוגה מסודרת
- סינון לפי התראות שנקראו/לא נקראו
- תצוגת מידע מוצר מפורטת בהתראה
- אנימציות וטרנזישנים חלקים

## ארכיטקטורה

### Backend

#### מודלים (Models)

```
backend/models/Notification.js
- userId: מזהה המשתמש
- type: סוג ההתראה (newProduct, discount, expiringSoon, priceAlert)
- title: כותרת ההתראה
- message: תוכן ההתראה
- productId: מזהה המוצר
- productData: מידע מוצר מקושר
- isRead: סטטוס קריאה
- createdAt: תאריך יצירה (TTL: 30 יום)
```

#### Routes

```
GET    /api/notifications/:userId           - קבלת כל ההתראות
PUT    /api/notifications/:notificationId/read  - סימון כנקרא
PUT    /api/notifications/:userId/read-all      - סימון הכל כנקרא
DELETE /api/notifications/:notificationId       - מחיקת התראה
DELETE /api/notifications/:userId/delete-all    - מחיקת כל ההתראות
POST   /api/notifications/check-nearby-products - בדיקת מוצרים קרובים
```

#### שירותים (Services)

```javascript
// backend/utils/notificationService.js

createNotificationsForNewProduct(product)
- יצירת התראות אוטומטיות למשתמשים רלוונטיים
- בדיקת התאמה למיקום, קטגוריה, מחיר
- חישוב מרחק ממשתמש למוצר

createExpiringProductNotifications()
- רץ אוטומטית כל 24 שעות
- מוצא מוצרים שיפקעו בתוך 3 ימים
- שולח התראות למשתמשים מתאימים
```

### Frontend

#### Views (דפים)

```
NotificationsView.vue           - מרכז התראות
NotificationSettingsView.vue    - דף הגדרות התראות
```

#### Services

```typescript
// frontend/src/services/notifications.ts

fetchNotifications()            - טעינת התראות
markAsRead()                    - סימון כנקרא
markAllAsRead()                 - סימון הכל כנקרא
deleteNotification()            - מחיקת התראה
checkNearbyProducts()           - בדיקת מוצרים קרובים
saveNotificationPreferences()   - שמירת העדפות
loadNotificationPreferences()   - טעינת העדפות
```

#### Components

```
TopBar.vue                      - כפתור התראות עם תג unread count
NotificationBubble.vue          - אינטגרציה עם אביבה הבוט
```

### Firebase/Firestore

#### מבנה מסמך משתמש

```javascript
{
  uid: "user123",
  notificationPreferences: {
    enabled: true,
    location: {
      lat: 32.0853,
      lng: 34.7818,
      city: "תל אביב",
      address: "רחוב דיזנגוף 100"
    },
    maxDistance: 10000,  // מטרים (10 ק"מ)
    categories: ["פירות וירקות", "מוצרי חלב"],
    priceRange: {
      min: 0,
      max: 100
    },
    onNewProducts: true,
    onDiscounts: true,
    onExpiringSoon: true
  }
}
```

## שימוש במערכת

### למשתמש קצה

1. **הגדרת העדפות**:

   - לחץ על אייקון ההתראות בטופ בר
   - לחץ על אייקון ההגדרות
   - הפעל/כבה התראות
   - הגדר מיקום (ידני או GPS)
   - בחר טווח חיפוש (1-50 ק"מ)
   - בחר קטגוריות מועדפות
   - הגדר טווח מחירים
   - בחר סוגי התראות

2. **צפייה בהתראות**:

   - לחץ על אייקון פעמון בטופ בר
   - תראה את כל ההתראות שלך
   - סנן לפי נקראו/לא נקראו
   - לחץ על התראה לצפייה במוצר

3. **בדיקה ידנית**:
   - בדף ההגדרות, לחץ "בדוק מוצרים קרובים עכשיו"
   - המערכת תחפש מוצרים חדשים באזורך

### למפתח

#### הוספת סוג התראה חדש

1. **עדכן את Enum ב-Model**:

```javascript
// backend/models/Notification.js
type: {
  type: String,
  enum: ["newProduct", "discount", "expiringSoon", "priceAlert", "yourNewType"],
  required: true,
}
```

2. **צור פונקציה ב-notificationService**:

```javascript
export async function createYourNewTypeNotifications() {
  // הלוגיקה שלך
}
```

3. **הוסף לתזמון בשרת**:

```javascript
// backend/server.js
setInterval(createYourNewTypeNotifications, INTERVAL);
```

#### התאמה אישית של קריטריוני סינון

ערוך את `createNotificationsForNewProduct` ב-notificationService.js:

```javascript
// הוסף קריטריון חדש
if (yourCustomCondition) {
  continue; // דלג על משתמש זה
}
```

## מבנה קבצים

```
project/
├── backend/
│   ├── models/
│   │   └── Notification.js           מודל התראות
│   ├── routes/
│   │   ├── notifications.js          API endpoints
│   │   └── products.js               אינטגרציה עם התראות
│   ├── utils/
│   │   └── notificationService.js    לוגיקת יצירת התראות
│   └── server.js                     תזמון אוטומטי
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── TopBar.vue            כפתור התראות + badge
    │   ├── services/
    │   │   └── notifications.ts      שירותי API
    │   ├── views/
    │   │   ├── NotificationsView.vue         מרכז התראות
    │   │   └── NotificationSettingsView.vue  דף הגדרות
    │   └── router/
    │       └── index.ts              נתיבים חדשים
```

## טיפים לפיתוח

### ביצועים

- השתמש באינדקסים ב-MongoDB (`userId`, `createdAt`, `isRead`)
- הגבל את מספר ההתראות שנטענות בפעם אחת
- השתמש ב-TTL index למחיקה אוטומטית אחרי 30 יום

### UX

- הצג אנימציות חלקות להתראות חדשות
- השתמש ב-badge לספירת התראות שלא נקראו
- אפשר סינון מהיר בין סוגי התראות

### אבטחה

- ודא שמשתמש יכול לגשת רק להתראות שלו
- אמת קלט מהמשתמש (מיקום, מרחק, וכו')
- הגבל מספר התראות ליום למשתמש

## עיצוב

המערכת משתמשת בעיצוב עקבי עם שאר האפליקציה:

- צבעים: #4CAF50 (ירוק ראשי), #ff4757 (אדום להתראות)
- Border radius: 12px
- Transitions: 0.2s ease
- Box shadows מרובדים

## בעיות נפוצות ופתרונות

### התראות לא נוצרות

- בדוק שהמשתמש הפעיל התראות בהגדרות
- וודא שיש מיקום למשתמש ב-Firestore
- בדוק שהמוצר החדש יש לו location.coordinates

### מרחק לא מחושב נכון

- וודא ש-coordinates במבנה נכון: [lng, lat]
- בדוק שיש 2dsphere index על location

### ביצועים איטיים

- הגדל את limit ב-queries
- הוסף אינדקסים נוספים במונגו
- שקול caching ל-user preferences

## TODO עתידי

- [ ] Push notifications למובייל (PWA)
- [ ] WebSocket לעדכונים בזמן אמת
- [ ] אפשרות להשתיק התראות בשעות מסוימות
- [ ] סטטיסטיקות התראות לאדמין
- [ ] בינה מלאכותית להמלצות מותאמות אישית

## תודות

- MongoDB Geospatial Queries
- Firebase Firestore
- Vue.js + TypeScript
- Express.js

---

**נוצר ב-2026 למערכת Fresh End**
