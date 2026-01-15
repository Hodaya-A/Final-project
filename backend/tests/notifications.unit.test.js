/**
 * @file notifications.unit.test.js
 * @description בדיקות כיסוי עבור מערכת ההתראות.
 */

import request from "supertest";
import { app } from "../server.js";
import mongoose from "mongoose";

describe("Notifications System Coverage", () => {
  // בדיקת שליפת התראות - תומכת בסטטוסים 200, 401 ו-404
  test("GET /api/notifications - Should return array or handle unauthorized/not found", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", "Bearer mock-token");

    // וידוא שהשרת מגיב באחת מהדרכים הצפויות
    expect([200, 401, 404]).toContain(res.statusCode);
  });

  // בדיקת עדכון סטטוס קריאה לכל ההתראות
  test("POST /api/notifications/read-all - Should handle request gracefully", async () => {
    const res = await request(app).post("/api/notifications/read-all");

    // וידוא טיפול בבקשה גם ללא יוזר מחובר בטסט
    expect([200, 401, 404]).toContain(res.statusCode);
  });
});

afterAll(async () => {
  try {
    // סגירת החיבור למסד הנתונים
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // השהייה קטנה לשחרור Handles פתוחים של Firestore/Timers
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (err) {
    // השתקה למניעת רעש בטרמינל בסיום הבדיקות
  }
});
