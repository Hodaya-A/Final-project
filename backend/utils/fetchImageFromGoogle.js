// backend/utils/fetchImageFromGoogle.js
import axios from "axios";

/** דומיינים מותרים (כולל תתי-דומיינים) */
const ALLOWED_HOSTS = [
  "res.cloudinary.com",
  "cloudinary.com",
  "img.rami-levy.co.il",
  "rami-levy.co.il",
  "shufersal.co.il",
  "img.shufersal.co.il",
  "www.rami-levy.co.il",
  "www.shufersal.co.il",
  // OpenFoodFacts:
  "images.openfoodfacts.org",
  "static.openfoodfacts.org",
  "world.openfoodfacts.org",
];

/** ריסון וקאש */
const QPS_DELAY_MS = Number(process.env.GOOGLE_QPS_MS || 350);
const CACHE_TTL_MS = Number(
  process.env.IMAGE_CACHE_TTL_MS || 1000 * 60 * 60 * 24 * 7
);
const cache = new Map();

const http = axios.create({
  timeout: 7000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
    Accept: "application/json, text/plain, */*",
  },
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function cleanupCache() {
  const now = Date.now();
  for (const [k, v] of cache.entries())
    if (now - v.ts > CACHE_TTL_MS) cache.delete(k);
}

/** ברקוד פלייסהולדר? (כמו 7290000000001) */
function isPlaceholderBarcode(b = "") {
  const s = String(b).trim();
  if (!/^\d{8,14}$/.test(s)) return false;
  // דפוס "729 + 9 אפסים + ספרה" נפוץ אצלך:
  if (/^7290{9}\d$/.test(s)) return true;
  // כל-אפסים וכו':
  if (/^0+$/.test(s)) return true;
  return false;
}

/** נירמול לינק ותיקון שגיאות כתיב נפוצות */
function normalizeUrl(raw) {
  try {
    let link = (raw || "").trim();
    link = link.replace(/^ht+tps?:\/\//i, "https://");
    link = link.replace(/co\.ill\b/gi, "co.il");
    link = link.replace("/uploaad/", "/upload/");
    link = link.replace("/uplooad/", "/upload/");
    link = link.replace("/uppload/", "/upload/");
    link = link.replace("/imaage/", "/image/").replace("/iimage/", "/image/");
    link = link.replace(/\/+https:\/\//i, "https://");
    link = link.replace(/([^:]\/)\/+/g, "$1");

    // פרוקסי _ipx של רמי-לוי -> חילוץ היעד
    if (link.includes("/_ipx/")) {
      const inner = link.match(/https?:\/\/img\.rami-levy\.co\.il\/[^\s"']+/i);
      if (inner && inner[0]) link = inner[0];
    }

    // לפעמים מגיע כ-param url=...
    const m = /[?&](?:url|u)=([^&]+)/i.exec(link);
    if (m?.[1]) {
      try {
        const decoded = decodeURIComponent(m[1]);
        if (/^https?:\/\//i.test(decoded)) link = decoded;
      } catch {}
    }

    const u = new URL(link);
    u.protocol = "https:";
    return u.toString();
  } catch {
    return null;
  }
}

function isAllowedHost(urlStr) {
  try {
    const u = new URL(urlStr);
    return ALLOWED_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

async function isReachableImage(urlStr) {
  try {
    const res = await http.head(urlStr, {
      maxRedirects: 2,
      validateStatus: () => true,
    });
    const ct = String(res.headers["content-type"] || "").toLowerCase();
    return res.status >= 200 && res.status < 400 && ct.startsWith("image/");
  } catch {
    return false;
  }
}

async function googleImageQuery(q, site) {
  const params = {
    key: process.env.GOOGLE_API_KEY,
    cx: process.env.GOOGLE_CX,
    q,
    searchType: "image",
    num: 10,
    safe: "off",
    gl: "il",
    hl: "he",
    lr: "lang_he",
    cr: "countryIL",
    imgType: "photo",
  };
  if (site) {
    params.siteSearch = site;
    params.siteSearchFilter = "i";
  }
  const { data } = await http.get(
    "https://www.googleapis.com/customsearch/v1",
    { params }
  );
  return Array.isArray(data.items) ? data.items : [];
}

/** --- Fallback: OpenFoodFacts לפי ברקוד --- */
async function fetchFromOpenFoodFacts(barcode) {
  if (!barcode || isPlaceholderBarcode(barcode)) return null;
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const { data } = await http.get(url, { validateStatus: () => true });
    const p = data?.product;
    if (!p) return null;

    // עדיפויות שדה תמונה
    const candidates = [
      p.image_front_url,
      p.image_url,
      p.image_small_url,
      p?.selected_images?.front?.display?.he,
      p?.selected_images?.front?.display?.en,
      p?.selected_images?.front?.display?.xxl,
      p?.selected_images?.front?.display?.l,
    ].filter(Boolean);

    for (const raw of candidates) {
      const normalized = normalizeUrl(raw);
      if (normalized && isAllowedHost(normalized)) {
        if (await isReachableImage(normalized)) return normalized;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Main */
export async function fetchImageFromGoogle(name, barcode = "") {
  // קאש
  const key = `${(name || "").trim()}|${(barcode || "").trim()}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.ts <= CACHE_TTL_MS) return hit.url;

  // ריסון קצב מול CSE
  await sleep(QPS_DELAY_MS);

  // אם הברקוד נראה פלייסהולדר – לא נבזבז עליו חיפושים
  const useBarcode = barcode && !isPlaceholderBarcode(barcode);

  const domains = ["img.rami-levy.co.il", "res.cloudinary.com"];
  const queries = [
    { q: name, site: null },
    ...domains.map((d) => ({ q: name, site: d })),
    ...(useBarcode ? [{ q: barcode, site: null }] : []),
    ...(useBarcode ? domains.map((d) => ({ q: barcode, site: d })) : []),
  ];

  // 1) גוגל CSE
  for (const { q, site } of queries) {
    try {
      const items = await googleImageQuery(q, site);
      const candidates = [];
      for (const it of items) {
        if (it?.link) candidates.push(it.link);
        if (it?.image?.thumbnailLink) candidates.push(it.image.thumbnailLink);
      }
      for (const raw of candidates) {
        const normalized = normalizeUrl(raw);
        if (!normalized || !isAllowedHost(normalized)) continue;
        await sleep(60);
        if (await isReachableImage(normalized)) {
          cache.set(key, { url: normalized, ts: now });
          return normalized;
        }
      }
    } catch (e) {
      if (String(e?.response?.status) === "429") {
        await sleep(QPS_DELAY_MS * 4);
        continue;
      }
    }
  }

  // 2) Fallback: OpenFoodFacts לפי ברקוד (אם אמיתי)
  if (useBarcode) {
    const offUrl = await fetchFromOpenFoodFacts(barcode);
    cache.set(key, { url: offUrl || null, ts: now });
    return offUrl || null;
  }

  cache.set(key, { url: null, ts: now });
  return null;
}
