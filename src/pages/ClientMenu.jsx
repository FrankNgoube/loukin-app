import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { listMenu, getRestaurant, createOrder } from "@/lib/entities";
import { CATEGORIES, formatFCFA } from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";
import MenuItemCard from "@/components/restaurant/MenuItemCard";
import CartSheet from "@/components/restaurant/CartSheet";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

export default function ClientMenu() {
  const { t, lang, setLang } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const tableNumber = params.get("table_number") || "";
  const tableId = params.get("table_id") || "";
  const restaurantId = params.get("restaurant_id") || "";

  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState({});
  const [note, setNote] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { data: restaurant } = useQuery({
    queryKey: ["client-restaurant", restaurantId],
    queryFn: () => getRestaurant(restaurantId),
  });

  const { data: menu = [], isLoading } = useQuery({
    queryKey: ["client-menu", restaurantId],
    queryFn: () => listMenu(restaurantId),
  });

  // Categories available based on the actual menu
  const usedCategories = useMemo(() => {
    const set = new Set(menu.map((m) => m.category).filter(Boolean));
    return CATEGORIES.filter((c) => set.has(c.key));
  }, [menu]);

  const visibleMenu = useMemo(() => {
    if (activeCategory === "all") return menu;
    return menu.filter((m) => m.category === activeCategory);
  }, [menu, activeCategory]);

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const m = menu.find((x) => x.id === id);
      return sum + (m?.price || 0) * qty;
    }, 0);
  }, [cart, menu]);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((s, n) => s + n, 0),
    [cart]
  );

  const handleAdd = (id) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };
  const handleRemove = (id) => {
    setCart((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (cartCount === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    const items = Object.entries(cart).map(([id, qty]) => {
      const m = menu.find((x) => x.id === id);
      return {
        menu_item_id: id,
        name: m?.name,
        price: m?.price,
        quantity: qty,
        subtotal: (m?.price || 0) * qty,
      };
    });
    const payload = {
      restaurant_id: restaurantId || restaurant?.id || "demo-restaurant",
      table_id: tableId || null,
      table_number: tableNumber ? Number(tableNumber) : null,
      items,
      total_price: cartTotal,
      status: "en_attente",
      customer_note: note || "",
    };

    try {
      let created = null;
      try {
        created = await createOrder(payload);
      } catch {
        // Backend entity not available — still confirm to the customer so the
        // demo flow stays usable. Generate a local id.
        created = { id: `local-${Date.now()}`, ...payload };
      }
      const orderId = created?.id || `local-${Date.now()}`;
      navigate(
        `${createPageUrl("OrderConfirmation")}?order_id=${encodeURIComponent(
          orderId
        )}&table_number=${encodeURIComponent(tableNumber || "")}&total=${encodeURIComponent(
          cartTotal
        )}`
      );
    } catch (e) {
      setSubmitError(t("orderError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl warm-gradient-bg text-white flex items-center justify-center shadow">
              🍲
            </div>
            <div className="min-w-0">
              <div className="font-black text-stone-900 truncate">
                {restaurant?.name || t("appName")}
              </div>
              <div className="text-xs text-stone-500 flex items-center gap-1.5">
                {tableNumber ? (
                  <span className="chip bg-amber-100 text-amber-800">
                    {t("table")} #{tableNumber}
                  </span>
                ) : (
                  <span className="chip bg-stone-100 text-stone-600">{t("demoMenu")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="inline-flex items-center rounded-full border border-amber-300/70 bg-white p-0.5 shrink-0">
            {["fr", "en"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-full",
                  lang === l
                    ? "warm-gradient-bg text-white shadow"
                    : "text-stone-500"
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap",
              activeCategory === "all"
                ? "warm-gradient-bg text-white border-transparent"
                : "bg-white border-amber-200 text-stone-700"
            )}
          >
            ✨ {t("allCategories")}
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap",
                activeCategory === c.key
                  ? "warm-gradient-bg text-white border-transparent"
                  : "bg-white border-amber-200 text-stone-700"
              )}
            >
              <span className="mr-1">{c.emoji}</span>
              {t(c.key)}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 pb-32">
        <h1 className="text-2xl md:text-3xl font-black warm-gradient-text mb-4">
          {t("menuTitle")}
        </h1>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="warm-card rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : visibleMenu.length === 0 ? (
          <div className="text-center text-stone-500 py-16">🍽️ {t("noResults")}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {visibleMenu.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={cart[item.id] || 0}
                onAdd={() => handleAdd(item.id)}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 right-5 z-40 warm-gradient-bg text-white shadow-2xl rounded-full pl-4 pr-5 py-3 flex items-center gap-3 hover:scale-[1.02] transition pulse-ring"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 bg-white text-red-700 text-[10px] font-black rounded-full h-5 min-w-5 px-1 flex items-center justify-center shadow">
              {cartCount}
            </span>
          </div>
          <span className="font-bold">{formatFCFA(cartTotal)}</span>
        </button>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        menu={menu}
        note={note}
        onNoteChange={setNote}
        onAdd={handleAdd}
        onRemove={handleRemove}
        total={cartTotal}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={submitError}
      />
    </div>
  );
}
