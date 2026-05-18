import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatFCFA, LOW_STOCK_THRESHOLD } from "@/lib/restaurant";

export default function MenuItemCard({ item, quantity, onAdd, onRemove }) {
  const { t } = useI18n();
  const stockUnlimited = item.stock_unlimited === true;
  const stock = stockUnlimited ? Infinity : Number(item.stock ?? 0);
  const soldOut = !item.is_available || stock <= 0;
  const isLow = !stockUnlimited && stock > 0 && stock <= LOW_STOCK_THRESHOLD;

  return (
    <div className="warm-card rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-amber-50">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {item.emoji || "🍽️"}
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
            <span className="chip bg-white text-red-700 border border-red-200">
              {t("soldOut")}
            </span>
          </div>
        )}
        {!soldOut && isLow && (
          <span className="absolute top-2 right-2 chip bg-amber-500 text-white shadow">
            {t("lowStock")} · {t("only")} {stock} {t("left")}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-stone-900 leading-tight">{item.name}</div>
            {item.description && (
              <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{item.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-black text-red-700">{formatFCFA(item.price)}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          {quantity > 0 ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-1 py-1">
              <button
                onClick={onRemove}
                className="h-8 w-8 rounded-full bg-white border border-amber-200 flex items-center justify-center hover:bg-amber-100"
                aria-label="Retirer"
              >
                <Minus className="h-4 w-4 text-red-700" />
              </button>
              <span className="min-w-6 text-center font-bold text-stone-900">{quantity}</span>
              <button
                onClick={onAdd}
                disabled={soldOut || (!stockUnlimited && quantity >= stock)}
                className="h-8 w-8 rounded-full warm-gradient-bg flex items-center justify-center text-white disabled:opacity-50"
                aria-label="Ajouter"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onAdd}
              disabled={soldOut}
              className="warm-gradient-bg text-white border-0 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" /> {t("addToCart")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
