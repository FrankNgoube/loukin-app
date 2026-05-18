// Domain constants and helpers for the restaurant app

export const ORDER_STATUSES = ["en_attente", "en_preparation", "prete", "servie"];

export const ORDER_STATUS_FLOW = {
  en_attente: "en_preparation",
  en_preparation: "prete",
  prete: "servie",
  servie: null,
};

export const ORDER_STATUS_LABELS = {
  fr: {
    en_attente: "En attente",
    en_preparation: "En préparation",
    prete: "Prête",
    servie: "Servie",
  },
  en: {
    en_attente: "Waiting",
    en_preparation: "Preparing",
    prete: "Ready",
    servie: "Served",
  },
};

export const ORDER_STATUS_COLORS = {
  en_attente: "bg-amber-100 text-amber-800 border-amber-200",
  en_preparation: "bg-orange-100 text-orange-800 border-orange-200",
  prete: "bg-emerald-100 text-emerald-800 border-emerald-200",
  servie: "bg-stone-100 text-stone-700 border-stone-200",
};

export const RESERVATION_STATUSES = ["en_attente", "confirmee", "annulee"];

export const CATEGORIES = [
  { key: "entrees", emoji: "🥗" },
  { key: "plats", emoji: "🍲" },
  { key: "accompagnements", emoji: "🍚" },
  { key: "desserts", emoji: "🍮" },
  { key: "boissons", emoji: "🥤" },
];

export const LOW_STOCK_THRESHOLD = 5;

// Cameroon - WAT UTC+1 - locale formatting
const fcfaFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export function formatFCFA(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "0 FCFA";
  return `${fcfaFormatter.format(Math.round(amount))} FCFA`;
}

export function formatDateTimeWAT(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Douala",
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatTimeWAT(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Douala",
    }).format(d);
  } catch {
    return "";
  }
}

export function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Douala",
  });
  return fmt.format(d) === fmt.format(now);
}

export function normalizeWhatsapp(input) {
  if (!input) return "";
  const cleaned = input.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+237")) return cleaned;
  if (cleaned.startsWith("237")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+237${cleaned.slice(1)}`;
  if (cleaned.startsWith("+")) return cleaned;
  return `+237${cleaned}`;
}

export function isValidCameroonNumber(input) {
  const n = normalizeWhatsapp(input);
  // +237 + 9 digits
  return /^\+237\d{9}$/.test(n);
}

// Build the public menu URL with QR-friendly params
export function buildMenuUrl({ origin, restaurantId, tableId, tableNumber }) {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurant_id", restaurantId);
  if (tableId) params.set("table_id", tableId);
  if (tableNumber !== undefined && tableNumber !== null) {
    params.set("table_number", String(tableNumber));
  }
  return `${base}/ClientMenu?${params.toString()}`;
}

export function buildQrImageUrl(content, size = 320) {
  const enc = encodeURIComponent(content);
  // Public QR generator - works without auth
  return `https://api.qrserver.com/v1/create-qr-code/?data=${enc}&size=${size}x${size}&margin=10`;
}
