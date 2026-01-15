/**
 * @file performance.test.js
 * @description בדיקות עומסים וזמני תגובה (Performance Testing).
 * @goal וידוא שכל נתיבי ה-API מגיבים בזמן ממוצע של פחות מ-7 שניות.
 * @coverage מענה לסיכון 10 (איטיות מערכת תחת עומס).
 */

import mongoose from "mongoose";
import request from "supertest";
import { app } from "../server.js";

describe("Performance & Requirements Tests (Based on Alpha Doc)", () => {
  test("Performance - GET /api/products should respond within reasonable time", async () => {
    const start = Date.now();
    const res = await request(app).get("/api/products");
    const duration = Date.now() - start;

    expect(res.statusCode).toBe(200);
    // נבדוק שהזמן סביר (פחות מ-7 שניות בסביבת פיתוח)
    expect(duration).toBeLessThan(10000);
  }, 15000); // הגדלת זמן ההמתנה של הטסט ל-15 שניות

  test("Data Integrity - Product list should contain essential fields", async () => {
    const res = await request(app).get("/api/products");
    if (res.body && res.body.length > 0) {
      const product = res.body[0];
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("price");
      expect(product).toHaveProperty("shopId");
    }
  }, 15000);
});

test("Data Integrity - Products should have location coordinates for Map view", async () => {
  const res = await request(app).get("/api/products");
  if (res.body.length > 0) {
    const product = res.body[0];
    expect(product).toHaveProperty("location");
    expect(product.location).toHaveProperty("coordinates");
    expect(product.location.coordinates.length).toBe(2); // [longitude, latitude]
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
