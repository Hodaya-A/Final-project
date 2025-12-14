require("dotenv").config();
const axios = require("axios");

async function testGoogleSearch(query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&searchType=image&q=${encodeURIComponent(
    query
  )}`;

  try {
    const res = await axios.get(url);
    const items = res.data.items || [];

    if (items.length === 0) {
      console.log("❌ לא נמצאו תוצאות לחיפוש:", query);
      return;
    }

    console.log(`🔍 נמצאו ${items.length} תוצאות!`);
    console.log("📸 תמונה ראשונה:", items[0].link);
  } catch (error) {
    console.error("⚠️ שגיאה בבקשה:", error.response?.data || error.message);
  }
}

// לדוגמה נבדוק מוצר ישראלי
testGoogleSearch("גבינה לבנה תנובה תמונה");
