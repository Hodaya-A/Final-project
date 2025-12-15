const express = require("express");
const fetch = require("node-fetch"); // אם את על Node 18+ אפשר להסיר
const fs = require("fs");
const path = require("path");
const router = express.Router();
// בראש הקובץ (אחרי require):
const cache = new Map(); // key -> { data, expires }
const TTL_MS = 10 * 60 * 1000; // 10 דקות

function getCache(key) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;
  cache.delete(key);
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, expires: Date.now() + TTL_MS });
}

// ===== /streets – רשימת רחובות לעיר עם Nominatim bbox + Overpass mirrors + cache =====
router.get("/streets", async (req, res) => {
  const { city, q = "" } = req.query;
  if (!city) return res.json([]);

  // קאש מלא לפי עיר
  const cacheKey = `streets_all|${city}`;
  const cached = getCache(cacheKey);
  if (cached) {
    const prefix = String(q).trim();
    if (!prefix) return res.json(cached);
    const first = prefix[0];
    return res.json(cached.filter((name) => String(name).startsWith(first)));
  }

  try {
    // 1) מבקשים מ-Nominatim את ה-bbox של העיר (מהיר ויציב)
    const nomiUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&addressdetails=1&city=${encodeURIComponent(
      String(city)
    )}`;
    const nr = await fetch(nomiUrl, {
      headers: { "User-Agent": "fresh-end-app/1.0 (contact: admin@fresh-end)" },
    });
    if (!nr.ok) {
      console.error("Nominatim status", nr.status);
      return res.status(502).json([]);
    }
    const ndata = await nr.json();
    if (!Array.isArray(ndata) || !ndata.length) {
      console.warn("Nominatim no results for city:", city);
      return res.json([]);
    }

    // Nominatim מחזיר boundingbox: [south, north, west, east] כמחרוזות
    const bb = ndata[0].boundingbox;
    // נמפה ל-S, N, W, E
    const south = Number(bb[0]);
    const north = Number(bb[1]);
    const west = Number(bb[2]);
    const east = Number(bb[3]);

    // 2) ניסוי מול מספר מראות Overpass עם bbox (מהיר יותר מ-area)
    const MIRRORS = [
      "https://overpass-api.de/api/interpreter",
      "https://z.overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    // שאילתה: כל ways עם highway + name בתוך ה-bbox
    const query = `
[out:json][timeout:40];
way(${south},${west},${north},${east})["highway"]["name"];
out tags;`;

    async function tryOne(url) {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
      });
      if (!r.ok) throw new Error(`Overpass ${url} status ${r.status}`);
      const data = await r.json();
      return data;
    }

    let odata = null;
    let lastErr = null;
    for (const m of MIRRORS) {
      try {
        odata = await tryOne(m);
        break; // הצליח באחד המראות
      } catch (e) {
        lastErr = e;
        console.warn("Overpass mirror failed:", e.message);
        continue;
      }
    }
    if (!odata) {
      console.error("All Overpass mirrors failed:", lastErr?.message);
      return res.status(502).json([]);
    }

    // 3) חילוץ שמות רחובות, ייחוד, ניקוי, מיון
    let roads = (odata.elements || [])
      .map((el) => el?.tags?.name ?? null)
      .filter(Boolean);

    roads = [...new Set(roads)]
      .map((s) => String(s).trim())
      .filter((s) => s.length > 1)
      .sort((a, b) => a.localeCompare(b, "he"));

    setCache(cacheKey, roads); // נשמור ל-10 דק'

    const prefix = String(q).trim();
    if (!prefix) return res.json(roads);
    const first = prefix[0];
    return res.json(roads.filter((name) => String(name).startsWith(first)));
  } catch (e) {
    console.error("streets error:", e.message);
    return res.status(500).json([]);
  }
});

// טוען את רשימת הערים מקובץ JSON
const citiesPath = path.join(__dirname, "../data/cities.json");
let citiesList = [];

try {
  const raw = fs.readFileSync(citiesPath, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    citiesList = parsed;
    console.log(`✅ נטענו ${citiesList.length} ערים מתוך cities.json`);
  } else {
    console.warn("⚠️ cities.json לא מכיל מערך תקין, משתמשים ברשימה ברירת מחדל");
    citiesList = ["ירושלים", "תל אביב-יפו", "חיפה", "באר שבע"];
  }
} catch (e) {
  console.error("❌ שגיאה בטעינת cities.json:", e.message);
  citiesList = ["ירושלים", "תל אביב-יפו", "חיפה", "באר שבע"];
}

// ✅ אימות כתובת – מחזיר גם פורמט מנורמל וגם lat/lng
// router.get("/validate", async (req, res) => {
// const { address } = req.query;
// if (!address || String(address).trim().length < 5) {
// return res.json({ ok: false, reason: "כתובת קצרה מדי" });
// }
// try {
// const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=il&q=${encodeURIComponent(
// String(address)
// )}`;
// const r = await fetch(url, {
// headers: { "User-Agent": "fresh-end-app/1.0 (contact: admin@fresh-end)" },
// });
// if (!r.ok) return res.json({ ok: false, reason: "שגיאה מול שירות המפות" });
// const results = await r.json();
// if (!Array.isArray(results) || results.length === 0) {
// return res.json({ ok: false, reason: "לא נמצאה כתובת מתאימה" });
// }
// const m = results[0];
// return res.json({
// ok: true,
// formatted: m.display_name,
// lat: Number(m.lat),
// lng: Number(m.lon),
// });
// } catch {
// return res.json({ ok: false, reason: "שגיאה באימות כתובת" });
// }
// });
router.get("/validate", async (req, res) => {
  const { address } = req.query;
  const addr = String(address || "").trim();
  if (addr.length < 5) {
    return res.json({ ok: false, reason: "כתובת קצרה מדי" });
  }

  // נסיון לקבל רכיבים בסיסיים מהטקסט (מספיק טוב לרוב המקרים)
  function parseParts(a) {
    // דוגמה: "דיזנגוף 100, תל אביב-יפו, ישראל"
    const parts = a
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const first = parts[0] || "";
    const city = (parts[1] || parts[0] || "").trim();
    // מפרקים "רחוב + מספר" מהחלק הראשון
    const m = first.match(/^(.+?)\s+(\d+.*)$/); // תופס גם 10א'
    const street = m ? m[1] : first;
    const house = m ? m[2] : "";
    return { street, house, city };
  }

  // נרמול שם עיר (וריאנטים נפוצים)
  function normalizeCity(c) {
    return String(c || "")
      .replace(/-/g, " ") // "תל אביב-יפו" -> "תל אביב יפו"
      .replace(/\s+/g, " ")
      .trim();
  }

  async function searchStructured(street, house, city) {
    const params = new URLSearchParams({
      format: "json",
      addressdetails: "1",
      limit: "1",
      countrycodes: "il",
      "accept-language": "he",
      street: house ? `${house} ${street}` : street,
      city: city,
      country: "Israel",
    });
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "fresh-end-app/1.0 (contact: admin@fresh-end)" },
    });
    if (!r.ok) return null;
    const arr = await r.json();
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  }

  async function searchFree(text) {
    const params = new URLSearchParams({
      format: "json",
      addressdetails: "1",
      limit: "1",
      countrycodes: "il",
      "accept-language": "he",
      q: text,
    });
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "fresh-end-app/1.0 (contact: admin@fresh-end)" },
    });
    if (!r.ok) return null;
    const arr = await r.json();
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  }

  try {
    const parts = parseParts(addr);
    const cityNorm = normalizeCity(parts.city);

    // 1) חיפוש מובנה: street+house+city+country
    let hit = await searchStructured(parts.street, parts.house, cityNorm);

    // 2) אם לא הצליח – נסה וריאנטים: בלי מספר בית
    if (!hit) hit = await searchStructured(parts.street, "", cityNorm);

    // 3) אם לא – טקסט חופשי כולל ישראל
    if (!hit)
      hit = await searchFree(
        `${parts.street} ${parts.house}, ${cityNorm}, ישראל`
      );

    // 4) ניסיון אחרון: טקסט חופשי בלי מספר
    if (!hit) hit = await searchFree(`${parts.street}, ${cityNorm}, ישראל`);

    if (!hit) {
      return res.json({
        ok: false,
        reason: "לא נמצאה כתובת מתאימה – נסי לדייק רחוב/מספר/עיר",
      });
    }

    return res.json({
      ok: true,
      formatted: hit.display_name,
      lat: Number(hit.lat),
      lng: Number(hit.lon),
    });
  } catch (e) {
    return res.json({ ok: false, reason: "שגיאה באימות כתובת" });
  }
});

// ✅ רשימת ערים מהקובץ JSON
router.get("/cities", (req, res) => {
  res.json(citiesList);
});

module.exports = router;
