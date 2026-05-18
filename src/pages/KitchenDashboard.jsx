import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, Flame, CheckCircle2, Utensils, RefreshCw } from "lucide-react";
import { listOrders, updateOrder } from "@/lib/entities";
import {
  ORDER_STATUSES,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  formatFCFA,
  formatTimeWAT,
} from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_ICONS = {
  en_attente: Clock,
  en_preparation: Flame,
  prete: CheckCircle2,
  servie: Utensils,
};

const STATUS_BUTTON_LABEL = {
  fr: {
    en_attente: "Démarrer la préparation",
    en_preparation: "Marquer prête",
    prete: "Marquer servie",
  },
  en: {
    en_attente: "Start preparing",
    en_preparation: "Mark ready",
    prete: "Mark served",
  },
};

export default function KitchenDashboard() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("active"); // "all" | "active" | <status>

  const { data: orders = [], isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () => listOrders(undefined, 200),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const counts = useMemo(() => {
    const out = { all: orders.length };
    for (const s of ORDER_STATUSES) {
      out[s] = orders.filter((o) => o.status === s).length;
    }
    out.active = orders.filter((o) => o.status !== "servie").length;
    return out;
  }, [orders]);

  const visible = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const da = new Date(a.created_date || 0).getTime();
      const db = new Date(b.created_date || 0).getTime();
      return da - db; // oldest first - oldest pending should be prepared first
    });
    if (statusFilter === "all") return sorted;
    if (statusFilter === "active") return sorted.filter((o) => o.status !== "servie");
    return sorted.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const advance = async (order) => {
    const next = ORDER_STATUS_FLOW[order.status];
    if (!next) return;
    try {
      await updateOrder(order.id, { status: next });
    } catch {
      // entity unavailable - optimistic UI: update cache locally
      qc.setQueryData(["kitchen-orders"], (old = []) =>
        old.map((o) => (o.id === order.id ? { ...o, status: next } : o))
      );
      return;
    }
    qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
  };

  const StatCard = ({ status, label, icon: Icon, color }) => (
    <button
      onClick={() => setStatusFilter(status === statusFilter ? "active" : status)}
      className={cn(
        "warm-card warm-card-hover rounded-2xl p-4 text-left flex items-center gap-3 transition",
        statusFilter === status && "ring-2 ring-red-500"
      )}
    >
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-stone-500">{label}</div>
        <div className="text-2xl font-black text-stone-900">{counts[status] ?? 0}</div>
      </div>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl warm-gradient-bg text-white flex items-center justify-center shadow-lg">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black warm-gradient-text">
              {t("kitchenTitle")}
            </h1>
            <div className="text-xs text-stone-500 flex items-center gap-1.5">
              <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
              {t("autoRefresh")}
              {dataUpdatedAt > 0 && (
                <span className="text-stone-400">· {formatTimeWAT(new Date(dataUpdatedAt).toISOString())}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          status="en_attente"
          label={t("waiting")}
          icon={Clock}
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          status="en_preparation"
          label={t("preparing")}
          icon={Flame}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          status="prete"
          label={t("ready")}
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          status="servie"
          label={t("served")}
          icon={Utensils}
          color="bg-stone-100 text-stone-700"
        />
      </section>

      <div className="flex flex-wrap gap-2 mb-4">
        {["active", "all", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border",
              statusFilter === s
                ? "warm-gradient-bg text-white border-transparent"
                : "bg-white border-amber-200 text-stone-700"
            )}
          >
            {s === "active"
              ? `🔥 ${t("filterAll")}`
              : s === "all"
              ? t("filterAll") + " +"
              : ORDER_STATUS_LABELS[lang][s]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="warm-card rounded-2xl text-center py-16">
          <div className="text-4xl mb-3">🍽️</div>
          <div className="text-stone-500">{t("noOrders")}</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((order) => {
            const Icon = STATUS_ICONS[order.status] || Clock;
            const nextStatus = ORDER_STATUS_FLOW[order.status];
            return (
              <article
                key={order.id}
                className={cn(
                  "warm-card rounded-2xl p-4 flex flex-col",
                  order.status === "en_attente" && "ring-1 ring-amber-300"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-stone-500">
                      {t("table")} · {t("receivedAt")} {formatTimeWAT(order.created_date)}
                    </div>
                    <div className="text-2xl font-black text-stone-900 leading-tight">
                      {order.table_number != null ? `#${order.table_number}` : "—"}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "chip border",
                      ORDER_STATUS_COLORS[order.status]
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {ORDER_STATUS_LABELS[lang][order.status]}
                  </span>
                </div>

                <ul className="space-y-1.5 mb-3">
                  {(order.items || []).map((it, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm py-1.5 border-b border-amber-100 last:border-0"
                    >
                      <span className="flex-1">
                        <span className="font-bold text-red-700 mr-1.5">{it.quantity}×</span>
                        {it.name}
                      </span>
                      <span className="text-stone-500 text-xs">{formatFCFA(it.subtotal)}</span>
                    </li>
                  ))}
                </ul>

                {order.customer_note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900 mb-3">
                    <span className="font-bold">📝 {t("customerNote")}:</span> {order.customer_note}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-3">
                  <div className="text-lg font-black text-stone-900">
                    {formatFCFA(order.total_price)}
                  </div>
                  {nextStatus && (
                    <Button
                      onClick={() => advance(order)}
                      className="warm-gradient-bg text-white border-0 shadow"
                    >
                      {STATUS_BUTTON_LABEL[lang][order.status]} →
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
