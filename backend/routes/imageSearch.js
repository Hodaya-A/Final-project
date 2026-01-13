// backend/routes/imageSearch.js
import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * חיפוש תמונות בGoogle Custom Search
 * מחזיר רשימה של תוצאות כדי שהמשתמש יוכל לבחור
 */
router.post("/search-images", async (req, res) => {
  const { productName } = req.body;

  if (!productName) {
    return res.status(400).json({ error: "חסר שם מוצר" });
  }

  try {
    // חיפוש פשוט בעברית - בדיוק כמו שהמשתמש מחפש
    const searchQuery = `${productName}`;
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;

    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: apiKey,
          cx: cx,
          q: searchQuery,
          searchType: "image",
          num: 10,
          safe: "medium",
          lr: "lang_iw", // חיפוש בעברית בלבד
        },
      }
    );

    const images =
      response.data.items?.map((item) => ({
        url: item.link,
        thumbnail: item.image.thumbnailLink,
        title: item.title,
        source: item.displayLink,
      })) || [];

    res.json({ ok: true, images });
  } catch (error) {
    console.error(
      "❌ שגיאה בחיפוש תמונות:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "שגיאה בחיפוש תמונות",
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

export default router;
