// Thin wrapper around Base44 entities so the UI keeps working even when
// the backend schema isn't seeded yet (we fall back to in-memory data).

import { base44 } from "@/api/base44Client";
import {
  SAMPLE_MENU,
  SAMPLE_RESTAURANT,
  SAMPLE_TABLES,
} from "@/lib/sample-data";

const ENTITY_NAMES = [
  "Restaurant",
  "Table",
  "MenuItem",
  "Order",
  "Reservation",
  "ScanCommande",
];

function getEntity(name) {
  try {
    return base44?.entities?.[name] ?? null;
  } catch {
    return null;
  }
}

async function safeCall(name, method, ...args) {
  const entity = getEntity(name);
  if (!entity || typeof entity[method] !== "function") {
    const err = new Error(`Entity ${name}.${method} unavailable`);
    err.code = "ENTITY_UNAVAILABLE";
    throw err;
  }
  return entity[method](...args);
}

// ---------------- Restaurant ----------------
export async function getRestaurant(id) {
  try {
    if (id) {
      const rows = await safeCall("Restaurant", "filter", { id });
      if (rows?.[0]) return rows[0];
    }
    const all = await safeCall("Restaurant", "list");
    if (all?.[0]) return all[0];
  } catch {}
  return SAMPLE_RESTAURANT;
}

// ---------------- MenuItem ----------------
export async function listMenu(restaurantId) {
  try {
    const filter = restaurantId ? { restaurant_id: restaurantId } : {};
    const rows = await safeCall("MenuItem", "filter", filter, "-created_date", 500);
    if (Array.isArray(rows) && rows.length) return rows;
  } catch {}
  return SAMPLE_MENU.map((m) => ({ ...m }));
}

export async function createMenuItem(payload) {
  return safeCall("MenuItem", "create", payload);
}
export async function updateMenuItem(id, payload) {
  return safeCall("MenuItem", "update", id, payload);
}
export async function deleteMenuItem(id) {
  return safeCall("MenuItem", "delete", id);
}

// ---------------- Tables ----------------
export async function listTables(restaurantId) {
  try {
    const filter = restaurantId ? { restaurant_id: restaurantId } : {};
    const rows = await safeCall("Table", "filter", filter, "table_number", 500);
    if (Array.isArray(rows) && rows.length) return rows;
  } catch {}
  return SAMPLE_TABLES.map((t) => ({ ...t }));
}
export async function createTable(payload) {
  return safeCall("Table", "create", payload);
}
export async function updateTable(id, payload) {
  return safeCall("Table", "update", id, payload);
}
export async function deleteTable(id) {
  return safeCall("Table", "delete", id);
}

// ---------------- Orders ----------------
export async function listOrders(restaurantId, limit = 200) {
  try {
    const filter = restaurantId ? { restaurant_id: restaurantId } : {};
    const rows = await safeCall("Order", "filter", filter, "-created_date", limit);
    if (Array.isArray(rows)) return rows;
  } catch {}
  return [];
}
export async function createOrder(payload) {
  return safeCall("Order", "create", payload);
}
export async function updateOrder(id, payload) {
  return safeCall("Order", "update", id, payload);
}

// ---------------- Reservations ----------------
export async function listReservations(restaurantId, limit = 200) {
  try {
    const filter = restaurantId ? { restaurant_id: restaurantId } : {};
    const rows = await safeCall("Reservation", "filter", filter, "-date", limit);
    if (Array.isArray(rows)) return rows;
  } catch {}
  return [];
}
export async function createReservation(payload) {
  return safeCall("Reservation", "create", payload);
}
export async function updateReservation(id, payload) {
  return safeCall("Reservation", "update", id, payload);
}

export { ENTITY_NAMES };
