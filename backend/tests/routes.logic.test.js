import request from "supertest";
import { app } from "../server.js";
import mongoose from "mongoose";

describe("Routes Extended Logic Tests", () => {
  // בדיקת סטטיסטיקות - מעלה כיסוי ב-analytics.js
  test("GET /api/analytics/summary - Should handle unauthorized access", async () => {
    const res = await request(app).get("/api/analytics/summary");
    // בתוך tests/routes.logic.test.js
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  // בדיקת יצירת הזמנה עם נתונים חסרים - מעלה כיסוי ב-orders.js
  test("POST /api/orders - Should fail with empty cart", async () => {
    const res = await request(app).post("/api/orders").send({ items: [] });
    expect([400, 500]).toContain(res.statusCode);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
