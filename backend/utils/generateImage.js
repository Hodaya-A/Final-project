// backend/utils/generateImage.js
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImage(productName) {
  try {
    console.log(`🎨 מייצר תמונה עבור: ${productName}`);

    const prompt = `צילום מוצר באיכות גבוהה, רקע לבן נקי, תאורה טבעית, ${productName} על מדף סופרמרקט ישראלי`;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024", // ✅ תוקן (512x512 לא נתמך יותר)
      quality: "high", // 🆕 מוסיף איכות גבוהה יותר
    });

    const imageBase64 = result.data[0].b64_json;
    const imageBuffer = Buffer.from(imageBase64, "base64");

    const safeName = productName
      .replace(/[^\w\sא-ת]/g, "")
      .replace(/\s+/g, "_");
    const fileName = `${safeName}.png`;
    const uploadsDir = path.join(process.cwd(), "uploads");

    // יצירת תקיית uploads אם לא קיימת
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);

    console.log(`✅ נוצרה תמונה: ${filePath}`);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("❌ שגיאה ביצירת תמונה:", error.message);
    return null;
  }
}
