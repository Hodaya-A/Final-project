require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");

// ✅ חיבור למסד הנתונים שלך
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ מחובר ל-MongoDB"))
  .catch((err) => console.error("❌ שגיאה בחיבור למונגו:", err));

// ✅ הגדרת הסכמה (מותאם למה שיש לך)
const productSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
});
const Product = mongoose.model("Product", productSchema);

// ✅ רשימת מילות חריגה (מוצרים שלא נחפש עבורם)
const excludedKeywords = ["אביבה", "בדיקה", "טסט", "demo", "test"];

// ✅ פונקציה לחיפוש תמונה
async function getImageForProduct(productName) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  const query = `${productName} site:ramilevy.co.il`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&searchType=image&q=${encodeURIComponent(
    query
  )}`;

  try {
    const res = await axios.get(url);
    const items = res.data.items || [];
    if (items.length === 0) {
      console.log(`⚠️ לא נמצאה תמונה עבור "${productName}"`);
      return null;
    }
    return items[0].link;
  } catch (error) {
    console.error(
      `❌ שגיאה בשליפת תמונה עבור "${productName}":`,
      error.response?.data?.error?.message || error.message
    );
    return null;
  }
}

// ✅ פונקציה לעדכון כל המוצרים
async function updateProductImages() {
  const products = await Product.find({});
  console.log(`🛒 נמצאו ${products.length} מוצרים במסד.`);

  for (const product of products) {
    const name = product.name?.trim() || "";

    // 🧩 דילוג על מוצרים לא רלוונטיים
    if (!name) {
      console.log("⚠️ מוצר ללא שם — דילוג.");
      continue;
    }
    if (excludedKeywords.some((word) => name.includes(word))) {
      console.log(`🚫 דילוג על "${name}" (שם לא רלוונטי).`);
      continue;
    }

    // אם כבר יש תמונה – דלג
    if (product.imageUrl) {
      console.log(`🔹 דילוג על "${name}" (כבר יש תמונה).`);
      continue;
    }

    // 🔍 חיפוש תמונה
    console.log(`🎨 מחפש תמונה עבור "${name}"...`);
    const imageUrl = await getImageForProduct(name);

    if (imageUrl) {
      product.imageUrl = imageUrl;
      await product.save();
      console.log(`✅ נשמרה תמונה עבור "${name}"`);
    }

    // 🕐 השהייה של שנייה אחת בין בקשות
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("🎉 סיום עדכון התמונות!");
  mongoose.connection.close();
}

// ✅ הפעלה
updateProductImages();
