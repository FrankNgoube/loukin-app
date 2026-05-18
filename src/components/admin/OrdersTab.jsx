import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { listOrders } from "@/lib/entities";
import {
  formatFCFA,
  formatDateTimeWAT,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function OrdersTab({ restaurantId }) {
  const { t, lang } = useI18n();
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders", restaurantId],
    queryFn: () => listOrders(restaurantId, 500),
    refetchInterval: 10000,
  });

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return orders;
    const term = q.toLowerCase();
    return orders.filter((o) => {
      if (String(o.table_number ?? "").includes(term)) return true;
      if (String(o.id ?? "").toLowerCase().includes(term)) return true;
      if (o.customer_note?.toLowerCase().includes(term)) return true;
      if ((o.items || []).some((it) => it.name?.toLowerCase().includes(term))) return true;
      return false;
    });
  }, [orders, q]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchOrders")}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-stone-500">{filtered.length} / {orders.length}</div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-stone-500 py-12">{t("noResults")}</div>
      ) : (
        <div className="warm-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-amber-100">
            {filtered.map((o) => (
              <div key={o.id} className="p-3 sm:p-4 flex flex-wrap gap-3 items-start">
                <div className="min-w-[80px]">
                  <div className="text-xs text-stone-500">{t("table")}</div>
                  <div className="font-black text-lg">
                    {o.table_number != null ? `#${o.table_number}` : "—"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-stone-500">
                    {formatDateTimeWAT(o.created_date)}
                  </div>
                  <ul className="text-sm mt-0.5">
                    {(o.items || []).map((it, i) => (
                      <li key={i} className="text-stone-700">
                        <span className="font-bold text-red-700">{it.quantity}×</span> {it.name}
                      </li>
                    ))}
                  </ul>
                  {o.customer_note && (
                    <div className="text-xs text-amber-800 mt-1">
                      📝 {o.customer_note}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "chip border text-[10px] mb-1",
                      ORDER_STATUS_COLORS[o.status]
                    )}
                  >
                    {ORDER_STATUS_LABELS[lang][o.status] || o.status}
                  </span>
                  <div className="font-black text-stone-900">{formatFCFA(o.total_price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
