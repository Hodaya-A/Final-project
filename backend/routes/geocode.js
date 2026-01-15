import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- מנגנון Cache (נשמר מהקוד שלך) ---
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

// ✅ הוספה חדשה: הראוט הראשי לטיפול בבקשות המפה מהפרונט-אנד
// זה פותר את שגיאת ה-CORS ב-ProductMapView.vue
router.get("/", async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // פנייה ל-Nominatim דרך השרת עם Header מזהה (חובה!)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      String(address)
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "fresh-end-app/1.0 (contact: admin@fresh-end)",
        "Accept-Language": "he,en", // מעדיף תוצאות בעברית
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Geocode error:", error.message);
    res.status(500).json({ error: "Failed to fetch coordinates" });
  }
});

// ===== /streets – רשימת רחובות לעיר =====
router.get("/streets", async (req, res) => {
  const { city, q = "" } = req.query;
  if (!city) return res.json([]);

  const cacheKey = `streets_all|${city}`;
  const cached = getCache(cacheKey);
  if (cached) {
    const prefix = String(q).trim();
    if (!prefix) return res.json(cached);
    const first = prefix[0];
    return res.json(cached.filter((name) => String(name).startsWith(first)));
  }

  try {
    // 1) Nominatim bbox
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
      return res.json([]);
    }

    const bb = ndata[0].boundingbox;
    const south = Number(bb[0]);
    const north = Number(bb[1]);
    const west = Number(bb[2]);
    const east = Number(bb[3]);

    // 2) Overpass API Mirrors
    const MIRRORS = [
      "https://overpass-api.de/api/interpreter",
      "https://z.overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

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
    for (const m of MIRRORS) {
      try {
        odata = await tryOne(m);
        break;
      } catch (e) {
        continue;
      }
    }
    if (!odata) {
      return res.status(502).json([]);
    }

    // 3) Process Results
    let roads = (odata.elements || [])
      .map((el) => el?.tags?.name ?? null)
      .filter(Boolean);

    roads = [...new Set(roads)]
      .map((s) => String(s).trim())
      .filter((s) => s.length > 1)
      .sort((a, b) => a.localeCompare(b, "he"));

    setCache(cacheKey, roads);

    const prefix = String(q).trim();
    if (!prefix) return res.json(roads);
    const first = prefix[0];
    return res.json(roads.filter((name) => String(name).startsWith(first)));
  } catch (e) {
    console.error("streets error:", e.message);
    return res.status(500).json([]);
  }
});

// --- טעינת רשימת ערים ---
const citiesPath = path.join(__dirname, "../data/cities.json");
let citiesList = [];

try {
  const raw = fs.readFileSync(citiesPath, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    citiesList = parsed;
    //console.log(` נטענו ${citiesList.length} ערים מתוך cities.json`);
  } else {
    citiesList = ["ירושלים", "תל אביב-יפו", "חיפה", "באר שבע"];
  }
} catch (e) {
  citiesList = ["ירושלים", "תל אביב-יפו", "חיפה", "באר שבע"];
}

//  אימות כתובת מורכב
router.get("/validate", async (req, res) => {
  const { address } = req.query;
  const addr = String(address || "").trim();
  if (addr.length < 5) {
    return res.json({ ok: false, reason: "כתובת קצרה מדי" });
  }

  function parseParts(a) {
    const parts = a
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const first = parts[0] || "";
    const city = (parts[1] || parts[0] || "").trim();
    const m = first.match(/^(.+?)\s+(\d+.*)$/);
    const street = m ? m[1] : first;
    const house = m ? m[2] : "";
    return { street, house, city };
  }

  function normalizeCity(c) {
    return String(c || "")
      .replace(/-/g, " ")
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

    let hit = await searchStructured(parts.street, parts.house, cityNorm);
    if (!hit) hit = await searchStructured(parts.street, "", cityNorm);
    if (!hit)
      hit = await searchFree(
        `${parts.street} ${parts.house}, ${cityNorm}, ישראל`
      );
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

// ✅ רשימת ערים
router.get("/cities", (req, res) => {
  res.json(citiesList);
});

// ✅ חיפוש חופשי (משמש חלקים אחרים במערכת)
router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q || String(q).trim().length < 3) {
    return res.status(400).json({ error: "נא להזין לפחות 3 תווים" });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&addressdetails=1&q=${encodeURIComponent(
      q
    )}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "fresh-end-app/1.0 (contact: admin@fresh-end)",
        "Accept-Language": "he,en",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "שגיאה בחיפוש כתובת" });
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.json({ found: false });
    }

    const result = data[0];
    return res.json({
      found: true,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      city:
        result.address?.city ||
        result.address?.town ||
        result.address?.village ||
        "",
      address: result.display_name,
    });
  } catch (error) {
    console.error("Error in geocode search:", error);
    return res.status(500).json({ error: "שגיאה בחיפוש כתובת" });
  }
});

export default router;
