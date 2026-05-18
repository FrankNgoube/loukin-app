import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, AlertTriangle } from "lucide-react";
import { listMenu, updateMenuItem } from "@/lib/entities";
import { LOW_STOCK_THRESHOLD, formatFCFA } from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function StockTab({ restaurantId }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-menu", restaurantId],
    queryFn: () => listMenu(restaurantId),
  });

  const applyLocal = (id, patch) => {
    qc.setQueryData(["admin-menu", restaurantId], (old = []) =>
      old.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
    // Also refresh other consumers of the menu
    qc.invalidateQueries({ queryKey: ["client-menu"] });
  };

  const update = async (item, patch) => {
    applyLocal(item.id, patch);
    try {
      await updateMenuItem(item.id, patch);
    } catch {
      // sample data — local update only
    }
  };

  const changeStock = (item, delta) => {
    if (item.stock_unlimited) return;
    const next = Math.max(0, Number(item.stock ?? 0) + delta);
    update(item, { stock: next, is_available: next > 0 ? item.is_available !== false : false });
  };

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const stock = Number(item.stock ?? 0);
          const isUnlimited = item.stock_unlimited === true;
          const isLow = !isUnlimited && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
          const isOut = !isUnlimited && stock <= 0;
          return (
            <div key={item.id} className="warm-card rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-xl bg-amber-50 overflow-hidden flex items-center justify-center text-2xl shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.emoji || "🍲"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-stone-900 truncate">{item.name}</div>
                  <div className="text-xs text-stone-500">{formatFCFA(item.price)}</div>
                </div>
                {isLow && !isOut && (
                  <span className="chip bg-amber-500 text-white">
                    <AlertTriangle className="h-3 w-3" /> {t("lowStock")}
                  </span>
                )}
                {isOut && <span className="chip bg-red-100 text-red-700">{t("soldOut")}</span>}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-stone-500">{t("stock")}</div>
                  <div className={cn("text-2xl font-black", isOut && "text-red-700")}>
                    {isUnlimited ? "∞" : stock}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => changeStock(item, -1)}
                    disabled={isUnlimited || stock <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="warm-gradient-bg text-white border-0"
                    onClick={() => changeStock(item, +1)}
                    disabled={isUnlimited}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white">
                  <span className="text-xs font-semibold">{t("available")}</span>
                  <Switch
                    checked={item.is_available !== false}
                    onCheckedChange={(v) => update(item, { is_available: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white">
                  <span className="text-xs font-semibold">∞</span>
                  <Switch
                    checked={isUnlimited}
                    onCheckedChange={(v) => update(item, { stock_unlimited: v })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
