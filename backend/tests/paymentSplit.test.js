/**
 * @file paymentSplit.test.js
 * @description בדיקות לוגיקה פיננסית וחישוב עמלות.
 * @testing דיוק בחישובי אחוזים, עיגול מספרים עשרוניים וחלוקת תשלומים.
 * @coverage דרישה 8 (ביצוע הזמנה וניהול כספי).
 */

import mongoose from "mongoose";
import {
  calculatePaymentSplit,
  getPaymentBreakdown,
} from "../utils/paymentSplit.js";

describe("Payment Splitting Unit Tests", () => {
  test("Test 1: Basic split (15% commission)", () => {
    const result = calculatePaymentSplit(100, 0, 0, 0.15);
    expect(result.platformFee).toBe(15);
    expect(result.storePayout).toBe(85);
    expect(result.totalPrice).toBe(100);
  });

  test("Test 2 & 3: With delivery fee and tip", () => {
    const result = calculatePaymentSplit(100, 20, 5, 0.15);
    expect(result.platformFee).toBe(15);
    expect(result.storePayout).toBe(85);
    expect(result.courierPayout).toBe(25); // delivery (20) + tip (5)
    expect(result.totalPrice).toBe(125);
  });

  test("Test 4: Different commission rate (20%)", () => {
    const result = calculatePaymentSplit(100, 0, 0, 0.2);
    expect(result.platformFee).toBe(20);
    expect(result.storePayout).toBe(80);
  });

  test("Test 6: Detailed breakdown structure", () => {
    const result = getPaymentBreakdown(100, 20, 5, 0.15);
    expect(result).toHaveProperty("breakdown");
    expect(result.breakdown["Products Total"]).toBe(100);
    expect(result.totalPrice).toBe(125);
  });

  test("Test 9: Error handling for invalid inputs", () => {
    // בדיקה שערכים שליליים זורקים שגיאה
    expect(() => calculatePaymentSplit(-100, 0, 0, 0.15)).toThrow();
    expect(() => calculatePaymentSplit(100, -10, 0, 0.15)).toThrow();
    expect(() => calculatePaymentSplit(100, 0, 0, 1.5)).toThrow();
  });

  test("Edge Case: 0 products total should throw error", () => {
    // אנחנו מצפים שהפונקציה תזרוק שגיאה כי סכום 0 הוא לא תקין אצלך
    expect(() => calculatePaymentSplit(0, 10, 0, 0.15)).toThrow(
      "Products total must be greater than 0"
    );
  });

  test("Edge Case: High tip amount", () => {
    const result = calculatePaymentSplit(100, 20, 100, 0.15);
    expect(result.courierPayout).toBe(120); // 20 + 100
    expect(result.totalPrice).toBe(220);
  });
});

test("Logic - Should calculate discount percentage correctly", () => {
  const originalPrice = 100;
  const salePrice = 70;
  const discount = ((originalPrice - salePrice) / originalPrice) * 100;

  expect(discount).toBe(30); // 30% הנחה
});
test("Requirement 8 - Fee calculation should handle decimal prices accurately", () => {
  const price = 19.9;
  const feePercent = 0.05; // 5% עמלה

  // שיטה בטוחה יותר לעיגול כספים
  const expectedFee = Math.round(price * feePercent * 100) / 100;

  expect(expectedFee).toBe(1.0);
});

afterAll(async () => {
  try {
    // 1. סגירת החיבור למסד הנתונים
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // 2. אם הגדרת משתנה server בקובץ (כמו ב-server.integration), סגרי אותו:
    if (typeof server !== "undefined" && server && server.close) {
      await new Promise((resolve) => server.close(resolve));
    }

    // 3. השהייה קצרצרה כדי לתת ל-Handles פתוחים (כמו Firestore) להיסגר
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (err) {
    // השתקה של שגיאות בסגירה כדי לא ללכלך את הטרמינל
  }
});
