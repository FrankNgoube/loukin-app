import React from "react";
import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { formatFCFA } from "@/lib/restaurant";

export default function CartSheet({
  open,
  onClose,
  cart,
  menu,
  note,
  onNoteChange,
  onAdd,
  onRemove,
  total,
  onSubmit,
  submitting,
  error,
}) {
  const { t } = useI18n();

  const lines = Object.entries(cart)
    .map(([id, qty]) => {
      const item = menu.find((m) => m.id === id);
      if (!item || qty <= 0) return null;
      return { item, qty };
    })
    .filter(Boolean);

  return (
    <>
      <div
        className={`fixed inset-0 bg-stone-900/40 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transition-transform flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label={t("cart")}
      >
        <header className="px-4 py-3 border-b border-amber-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-red-50">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl warm-gradient-bg text-white flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="font-black text-stone-900">{t("yourOrder")}</div>
              <div className="text-xs text-stone-500">{t("paymentCash")}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-white/60 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
          {lines.length === 0 ? (
            <div className="text-center text-stone-500 py-16">
              <div className="text-4xl mb-2">🍽️</div>
              {t("emptyCart")}
            </div>
          ) : (
            lines.map(({ item, qty }) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-xl border border-amber-100 bg-amber-50/30"
              >
                <div className="h-14 w-14 rounded-lg bg-white overflow-hidden flex items-center justify-center text-2xl shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.emoji || "🍲"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.name}</div>
                  <div className="text-xs text-stone-500">{formatFCFA(item.price)}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="h-7 w-7 rounded-full bg-white border border-amber-200 flex items-center justify-center"
                  >
                    <Minus className="h-3.5 w-3.5 text-red-700" />
                  </button>
                  <span className="min-w-5 text-center text-sm font-bold">{qty}</span>
                  <button
                    onClick={() => onAdd(item.id)}
                    className="h-7 w-7 rounded-full warm-gradient-bg flex items-center justify-center text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {lines.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-stone-700 mb-1.5 block">
                {t("noteForChef")}
              </label>
              <Textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={t("notePlaceholder")}
                rows={2}
                className="bg-amber-50/30"
              />
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <footer className="p-4 border-t border-amber-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 font-medium">{t("total")}</span>
              <span className="text-2xl font-black text-red-700">{formatFCFA(total)}</span>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="w-full warm-gradient-bg text-white border-0 h-12 text-base font-bold disabled:opacity-60"
            >
              {submitting ? t("sending") : t("sendOrder")}
            </Button>
          </footer>
        )}
      </aside>
    </>
  );
}
