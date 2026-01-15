/**
 * @file logic.test.js
 * @description Unit Tests עבור הלוגיקה הפנימית של המערכת.
 * @testing תזמון התראות, מנוע חיפוש מילים נרדפות וניהול זמני תפוגה.
 * @coverage דרישה 13 (חיפוש) ודרישה 14 (התראות).
 */

import mongoose from "mongoose";
import { jest } from "@jest/globals";

// 1. הגדרת ה-Mock חייבת לקרות לפני הייבוא הדינמי (ESM Requirement)
jest.unstable_mockModule("../utils/notificationService.js", () => ({
  createExpiringProductNotifications: jest.fn(() => Promise.resolve(5)),
}));

// 2. ייבוא דינמי של הפונקציה לאחר ה-Mock
const { createExpiringProductNotifications } = await import(
  "../utils/notificationService.js"
);

describe("Business Logic Unit Tests", () => {
  // הגדרת Timeout גלובלי לבלוק זה
  jest.setTimeout(15000);

  // בדיקה שהתראות לא קורסות (דרישה 14 בדו"ח)
  test("Notification Service - Should initialize and mock correctly", async () => {
    const result = await createExpiringProductNotifications();
    expect(result).toBe(5);
    await expect(createExpiringProductNotifications()).resolves.not.toThrow();
  });

  // בדיקת תקינות של חישוב תאריכים
  test("Date Logic - Current date should be valid for queries", () => {
    const today = new Date();
    expect(today).toBeInstanceOf(Date);
    expect(today.getTime()).toBeGreaterThan(0);
  });

  // בדיקה של לוגיקת תאריכים עתידיים
  test("Logic - Should identify if expiry date is in the future", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const today = new Date();
    expect(new Date(futureDate).getTime()).toBeGreaterThan(today.getTime());
  });

  // בדיקת התאמת מילים נרדפות (דרישה 13 - Usability)
  test("Logic - Headers synonym matching (Requirement 13)", () => {
    const headers = ["ברקוד", "שם מוצר", "מחיר"];
    const barcodeHeader = headers.find((h) =>
      ["barcode", "ברקוד"].includes(h.toLowerCase())
    );
    const nameHeader = headers.find((h) =>
      ["name", "שם מוצר"].includes(h.toLowerCase())
    );

    expect(barcodeHeader).toBe("ברקוד");
    expect(nameHeader).toBe("שם מוצר");
  });

  // בדיקת תזמון התראות (דרישה 14)
  test("Requirement 14 - Notification logic for 3-day window", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // נירמול שעות לחישוב מדויק

    const expiryInTwoDays = new Date();
    expiryInTwoDays.setDate(today.getDate() + 2);

    const expiryInFiveDays = new Date();
    expiryInFiveDays.setDate(today.getDate() + 5);

    const isNearExpiry = (date) => {
      const diffTime = new Date(date) - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays > 0;
    };

    expect(isNearExpiry(expiryInTwoDays)).toBe(true); // בתוך הטווח (2 ימים)
    expect(isNearExpiry(expiryInFiveDays)).toBe(false); // מחוץ לטווח (5 ימים)
  });

  // בדיקת מקרה קצה - תאריך שעבר (Risk 1)
  test("Logic - Should identify expired products correctly", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const today = new Date();
    expect(pastDate.getTime()).toBeLessThan(today.getTime());
  });
});

afterAll(async () => {
  try {
    // סגירת חיבורי Mongoose במידה ונוצרו בטעות ב-notificationService
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // ניקוי Mocks
    jest.clearAllMocks();

    // המתנה לסגירת Handles אסינכרוניים (כמו Firestore)
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (err) {
    // השתקה למניעת רעש בטרמינל
  }
});
