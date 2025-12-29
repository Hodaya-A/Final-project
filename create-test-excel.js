const XLSX = require("xlsx");
const dayjs = require("dayjs");

const today = dayjs();

// יצירת נתונים עם כותרות בעברית
const data = [
  // שורת כותרות
  [
    "ברקוד",
    "שם מוצר",
    "מחיר",
    "מחיר מבצע",
    "קטגוריה",
    "כמות",
    "תאריך תפוגה",
    "קישור תמונה",
  ],
  // מוצרים
  [
    "1001",
    "חלב - פג תוקף אתמול",
    5.9,
    4.9,
    "חלב ומוצריה",
    50,
    today.subtract(1, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=חלב",
  ],
  [
    "1002",
    "לחם - פג תוקף היום",
    8.5,
    7.2,
    "לחם ומאפים",
    30,
    today.format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=לחם",
  ],
  [
    "1003",
    "גבינה - פוגה מחר",
    18.9,
    15.9,
    "גבינות",
    25,
    today.add(1, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=גבינה",
  ],
  [
    "1004",
    "יוגורט - 2 ימים",
    4.5,
    4.5,
    "מוצרי חלב",
    100,
    today.add(2, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=יוגורט",
  ],
  [
    "1005",
    "מיץ - 3 ימים",
    9.9,
    8.5,
    "משקאות",
    40,
    today.add(3, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=מיץ",
  ],
  [
    "1006",
    "קוטג תקין",
    6.9,
    6.9,
    "גבינות",
    60,
    today.add(7, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=קוטג",
  ],
  [
    "1007",
    "שמנת תקין",
    7.5,
    6.9,
    "מוצרי חלב",
    35,
    today.add(14, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=שמנת",
  ],
  [
    "1008",
    "ביצים תקין",
    12.9,
    12.9,
    "ביצים",
    80,
    today.add(30, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=ביצים",
  ],
  [
    "1009",
    "חמאה ארוך",
    11.5,
    9.9,
    "חמאה",
    45,
    today.add(60, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=חמאה",
  ],
  [
    "1010",
    "גבינת עיזים",
    25.9,
    22.9,
    "גבינות",
    20,
    today.add(10, "day").format("YYYY-MM-DD"),
    "https://via.placeholder.com/300?text=גבינת-עיזים",
  ],
];

// יצירת worksheet
const ws = XLSX.utils.aoa_to_sheet(data);

// יצירת workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "מוצרים");

// שמירת הקובץ
XLSX.writeFile(wb, "מוצרים-בדיקה-חדש.xlsx");

console.log("✅ הקובץ נוצר בהצלחה: מוצרים-בדיקה-חדש.xlsx");
console.log("📅 תאריכים:");
console.log("  - פג אתמול:", today.subtract(1, "day").format("YYYY-MM-DD"));
console.log("  - פג היום:", today.format("YYYY-MM-DD"));
console.log("  - פוגה מחר:", today.add(1, "day").format("YYYY-MM-DD"));
console.log("  - פוגה ב-2 ימים:", today.add(2, "day").format("YYYY-MM-DD"));
console.log("  - פוגה ב-3 ימים:", today.add(3, "day").format("YYYY-MM-DD"));
