# הוראות להגדרת Google Custom Search API

## צעדים:

1. **צור Google Custom Search Engine:**

   - גש ל: https://programmablesearchengine.google.com/
   - לחץ "Add" ליצירת מנוע חיפוש חדש
   - ב"Sites to search" הוסף:
     - rami-levy.co.il/\*
     - shufersal.co.il/\*
     - yinotbitan.co.il/\*
   - הפעל "Image search"
   - שמור והעתק את ה-**Search Engine ID**

2. **קבל API Key:**

   - גש ל: https://console.cloud.google.com/
   - צור פרויקט חדש
   - הפעל "Custom Search API"
   - צור API Key
   - העתק את המפתח

3. **הוסף ל-.env:**

   ```
   GOOGLE_API_KEY=your_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=your_engine_id_here
   ```

4. **הרץ:** `node googleApiImageSearch.js`

## חלופה - ללא API:

אם את לא רוצה להשתמש ב-API, הפתרון הכי טוב הוא:

- להוסיף תמונות ידנית דרך ממשק הניהול
- או להעלות CSV עם קישורים לתמונות
- או להשתמש בתמונות Unsplash האיכותיות (800px HD)
