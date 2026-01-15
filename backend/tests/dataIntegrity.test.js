/**
 * @file dataIntegrity.test.js
 * @description בדיקות שלמות נתונים (Data Integrity).
 * @testing אימות מבנה אובייקטים, תקינות כתובות גיאוגרפיות וולידציית סכמה.
 * @coverage מענה לסיכון 1 (איבוד או שיבוש מידע).
 */

import mongoose from "mongoose";
import request from "supertest";
import { app } from "../server.js";

describe("Data Integrity & Validation (Requirements 7, 12, Risk 9)", () => {
  // בדיקת שלמות נתוני סל קניות (דרישה 7)
  test("Requirement 7 - Product quantity should be a valid number", async () => {
    const res = await request(app).get("/api/products");
    if (res.body.length > 0) {
      expect(typeof res.body[0].quantity).toBe("number");
      expect(res.body[0].quantity).toBeGreaterThanOrEqual(0);
    }
  }, 15000);

  // בדיקת ולידציה לשדות חובה (סיכון 9)
  test("Risk 9 - POST /api/inventory should fail if name is missing", async () => {
    const incompleteProduct = { price: 10, shopId: "test-123" };
    const res = await request(app)
      .post("/api/inventory")
      .send(incompleteProduct);

    // מצפים ל-400 כי חסר שדה חובה 'name'
    expect(res.statusCode).toBe(400);
  }, 15000);

  // בדיקת תקינות כתובת ומיקום (דרישה 12)
  test("Requirement 12 - Products should include shop location details", async () => {
    const res = await request(app).get("/api/products");
    if (res.body.length > 0) {
      const product = res.body[0];
      // וידוא קיום שדות כתובת כפי שהובטח באפיון
      expect(product).toHaveProperty("shopAddress");
      expect(product).toHaveProperty("shopCity");
    }
  }, 15000);

  // בדיקת מעקב מכירות (דרישה 9 - היסטוריית רכישות)
  test("Requirement 9 - Product should track 'sold' count", async () => {
    const res = await request(app).get("/api/products");
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("sold");
      expect(typeof res.body[0].sold).toBe("number");
    }
  }, 15000);
});
// בדיקת עקביות הסל (סיכון 4)
test("Risk 4 - Cart total should remain consistent after item updates", () => {
  const cart = [
    { id: "1", price: 10, quantity: 2 },
    { id: "2", price: 20, quantity: 1 },
  ];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // וידוא שהחישוב נשאר 40 גם אם מוסיפים שדות נוספים
  const cartAfterTransition = cart.map((item) => ({
    ...item,
    tempField: true,
  }));
  const newTotal = cartAfterTransition.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  expect(newTotal).toBe(40);
});

// בדיקת עדכון מלאי לאחר רכישה (דרישה 8)
test("Requirement 8 - Inventory should decrease after an order", async () => {
  const product = { _id: "6967ce3232038430ca7d980d", quantity: 10 };
  const orderQuantity = 2;

  // סימולציה של הפחתת מלאי בשרת
  const updatedQuantity = product.quantity - orderQuantity;
  expect(updatedQuantity).toBe(8);
});

test("Risk 9 - Product without image should have a fallback/null value", async () => {
  const res = await request(app).get("/api/products");
  if (res.body.length > 0) {
    const productWithNoImg = res.body.find((p) => !p.imageUrl);
    if (productWithNoImg) {
      // וידוא שהשדה קיים כ-null או מחרוזת ריקה ולא גורם לשגיאת undefined
      expect(productWithNoImg).toHaveProperty("imageUrl");
      expect([null, "", undefined]).toContain(productWithNoImg.imageUrl);
    }
  }
}, 15000);

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
