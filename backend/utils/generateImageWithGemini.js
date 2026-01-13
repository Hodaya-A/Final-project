// backend/utils/generateImageWithGemini.js
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * הורדת תמונה מהאינטרנט ושמירה בשרת
 */
async function downloadAndSaveImage(imageUrl, productName) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const safeFileName = productName
      .replace(/[^א-תa-zA-Z0-9]/g, "_")
      .substring(0, 50);

    const fileName = `${safeFileName}_${Date.now()}.jpg`;

    const uploadsDir = path.join(__dirname, "..", "uploads", "images");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, response.data);

    return `/uploads/images/${fileName}`;
  } catch (error) {
    console.error(`⚠️ שגיאה בהורדת תמונה: ${error.message}`);
    return null;
  }
}

/**
 * חיפוש תמונות מאתר רמי לוי - הפתרון שאת רוצה!
 * מחפש ישירות באתר של רמי לוי
 */
async function searchRamiLevyImages(productName) {
  try {
    // נחפש באתר רמי לוי
    const searchQuery = encodeURIComponent(productName);

    // רמי לוי משתמש בחיפוש פשוט
    const searchUrl = `https://www.rami-levy.co.il/he/online/search?q=${searchQuery}`;

    console.log(`🛒 רמי לוי: מחפש "${productName}" ב-${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();

    // חיפוש תמונות במבנה HTML של רמי לוי
    // רמי לוי משתמש ב-img tags עם src או data-src
    const imageMatches = html.match(/<img[^>]+src="([^"]*product[^"]*)"/gi);

    if (imageMatches && imageMatches.length > 0) {
      // נמצא את ה-URL הראשון
      const match = imageMatches[0].match(/src="([^"]*)"/);
      if (match && match[1]) {
        let imageUrl = match[1];

        // אם זה URL יחסי, נוסיף את הדומיין
        if (imageUrl.startsWith("/")) {
          imageUrl = `https://www.rami-levy.co.il${imageUrl}`;
        } else if (!imageUrl.startsWith("http")) {
          imageUrl = `https://www.rami-levy.co.il/${imageUrl}`;
        }

        console.log(`✅ נמצאה תמונה מרמי לוי: ${imageUrl}`);
        return imageUrl;
      }
    }

    console.log(`⚠️ לא נמצאה תמונה באתר רמי לוי`);
    return null;
  } catch (error) {
    console.error("⚠️ Rami Levy scraping error:", error.message);
    return null;
  }
}

/**
 * חיפוש תמונות ב-Unsplash - חינמי לגמרי!
 * תמונות מקצועיות של מוצרי מזון
 */
async function searchUnsplashImage(productName) {
  try {
    const searchQuery = encodeURIComponent(productName);
    // Unsplash Source API - לא דורש API key!
    const url = `https://source.unsplash.com/400x400/?${searchQuery},food,product`;

    console.log(`📸 Unsplash: מחפש "${productName}"`);
    return url;
  } catch (error) {
    console.error("⚠️ Unsplash error:", error.message);
    return null;
  }
}

/**
 * חיפוש תמונות מ-Open Food Facts - חינמי לגמרי!
 * API ציבורי עם תמונות אמיתיות של מוצרי מזון
 */
async function searchOpenFoodFacts(productName) {
  try {
    // אסטרטגיות חיפוש מרובות
    const searchStrategies = [
      productName, // החיפוש המקורי
      `${productName} israel`, // עם ישראל
      productName.split(" ")[0], // רק המילה הראשונה (למשל "tnuva")
    ];

    for (const searchTerm of searchStrategies) {
      const searchQuery = encodeURIComponent(searchTerm);
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&json=1&page_size=10`;

      console.log(`🔍 Open Food Facts: מחפש "${searchTerm}"`);

      const response = await fetch(url);
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        // נעבור על המוצרים ונחפש את המתאים ביותר
        for (const product of data.products) {
          if (product.image_url && product.product_name) {
            console.log(`📦 מצאתי: ${product.product_name}`);
            return product.image_url;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("⚠️ Open Food Facts error:", error.message);
    return null;
  }
}

/**
 * תרגום פשוט של מילים נפוצות מעברית לאנגלית
 */
function translateToEnglish(hebrewText) {
  const translations = {
    חלב: "milk",
    תנובה: "tnuva",
    גבינה: "cheese",
    לבנה: "cottage cheese",
    יוגורט: "yogurt",
    ביצים: "eggs",
    לחם: "bread",
    חמאה: "butter",
    שמנת: "cream",
    מיץ: "juice",
    תפוזים: "orange",
    עגבניות: "tomatoes",
    מלפפון: "cucumber",
    בקר: "beef",
    עוף: "chicken",
    פסטה: "pasta",
    אורז: "rice",
    שוקו: "chocolate milk",
    קוטג: "cottage",
    שמן: "oil",
  };

  let englishText = hebrewText.toLowerCase();

  // החלף כל מילה עברית באנגלית
  for (const [hebrew, english] of Object.entries(translations)) {
    const regex = new RegExp(hebrew, "g");
    englishText = englishText.replace(regex, english);
  }

  // הסר תווים מיוחדים ושאר את האחוזים והמספרים
  englishText = englishText.replace(/[^a-z0-9%\s]/g, " ").trim();

  return englishText;
}

/**
 * חיפוש תמונות חינמי מאתרי סופרמרקטים באמצעות Google Custom Search
 * מתמקד ברמי לוי, שופרסל וסופרמרקטים נוספים
 */
export async function generateImageWithDALLE(productName, category = "") {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;

    if (!apiKey || !cx) {
      console.warn(
        "⚠️ GOOGLE_API_KEY או GOOGLE_CX לא קיימים, משתמש ב-placeholder"
      );
      return generatePlaceholderImage(productName);
    }

    console.log(`🔍 מחפש תמונה עבור: ${productName}`);

    // תרגם את שם המוצר לאנגלית
    const englishName = translateToEnglish(productName);
    console.log(`🔤 תרגום לאנגלית: ${englishName}`);

    // אסטרטגיות חיפוש עם Google - כמו שאת רוצה!
    const searchStrategies = [
      `${englishName} shufersal`, // שופרסל באנגלית
      `${englishName} rami levy`, // רמי לוי
      `${englishName} supermarket israel`, // סופרמרקט ישראל
      `${englishName} product`, // מוצר כללי
    ];

    for (const query of searchStrategies) {
      console.log(`🔍 Google: מחפש "${query}"`);

      const imageUrl = await searchGoogleImage(apiKey, cx, query);

      if (imageUrl) {
        console.log(`✅ נמצאה תמונה: ${imageUrl}`);

        // הורד את התמונה לשרת שלנו
        const localPath = await downloadAndSaveImage(imageUrl, productName);
        if (localPath) {
          console.log(`💾 תמונה נשמרה ב: ${localPath}`);
          return localPath;
        }

        return imageUrl;
      }
    }

    console.log("⚠️ לא נמצאה תמונה, משתמש ב-placeholder");
    return generatePlaceholderImage(productName);
  } catch (error) {
    console.error("❌ שגיאה בחיפוש תמונה:", error.message);
    return generatePlaceholderImage(productName);
  }
}

/**
 * פונקציה עזר לחיפוש תמונה בגוגל
 */
async function searchGoogleImage(apiKey, cx, query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodedQuery}&searchType=image&num=1`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.error) {
      console.error(`⚠️ Google API Error: ${data.error.message}`);
      return null;
    }

    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    }

    return null;
  } catch (error) {
    console.error(`⚠️ שגיאה בחיפוש "${query}":`, error.message);
    return null;
  }
}

function generatePlaceholderImage(productName) {
  const encodedName = encodeURIComponent(productName);
  return `https://placehold.co/400x400/e8f5e9/2e7d32?text=${encodedName}&font=rubik`;
}
