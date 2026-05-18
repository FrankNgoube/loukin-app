import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Utensils,
  Table as TableIcon,
  ListOrdered,
  CalendarDays,
  Boxes,
  Receipt,
  CalendarClock,
} from "lucide-react";
import { listOrders, listReservations, listMenu, getRestaurant } from "@/lib/entities";
import { formatFCFA, isToday } from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";

import MenuTab from "@/components/admin/MenuTab";
import TablesTab from "@/components/admin/TablesTab";
import OrdersTab from "@/components/admin/OrdersTab";
import ReservationsTab from "@/components/admin/ReservationsTab";
import StockTab from "@/components/admin/StockTab";

export default function AdminDashboard() {
  const { t } = useI18n();

  const { data: restaurant } = useQuery({
    queryKey: ["admin-restaurant"],
    queryFn: () => getRestaurant(),
  });
  const restaurantId = restaurant?.id || "demo-restaurant";

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders", restaurantId],
    queryFn: () => listOrders(restaurantId, 500),
    refetchInterval: 10000,
  });
  const { data: reservations = [] } = useQuery({
    queryKey: ["admin-reservations", restaurantId],
    queryFn: () => listReservations(restaurantId),
  });
  const { data: menu = [] } = useQuery({
    queryKey: ["admin-menu", restaurantId],
    queryFn: () => listMenu(restaurantId),
  });

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => isToday(o.created_date));
    const todayRevenue = todayOrders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      pendingReservations: reservations.filter((r) => r.status === "en_attente").length,
      activeMenuItems: menu.filter(
        (m) => m.is_available !== false && (m.stock_unlimited || (m.stock ?? 0) > 0)
      ).length,
    };
  }, [orders, reservations, menu]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="text-xs text-stone-500">{restaurant?.name || t("appName")}</div>
        <h1 className="text-2xl md:text-3xl font-black warm-gradient-text">{t("adminTitle")}</h1>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBlock
          icon={ListOrdered}
          color="bg-red-100 text-red-700"
          label={t("todayOrders")}
          value={stats.todayOrders}
        />
        <StatBlock
          icon={Receipt}
          color="bg-amber-100 text-amber-700"
          label={t("todayRevenue")}
          value={formatFCFA(stats.todayRevenue)}
          big
        />
        <StatBlock
          icon={CalendarClock}
          color="bg-orange-100 text-orange-700"
          label={t("pendingReservations")}
          value={stats.pendingReservations}
        />
        <StatBlock
          icon={Utensils}
          color="bg-emerald-100 text-emerald-700"
          label={t("activeMenuItems")}
          value={stats.activeMenuItems}
        />
      </section>

      <Tabs defaultValue="menu">
        <TabsList className="bg-white border border-amber-200 flex flex-wrap h-auto">
          <TabsTrigger value="menu" className="data-[state=active]:warm-gradient-bg data-[state=active]:text-white">
            <Utensils className="h-4 w-4 mr-1.5" /> {t("tabMenu")}
          </TabsTrigger>
          <TabsTrigger value="tables" className="data-[state=active]:warm-gradient-bg data-[state=active]:text-white">
            <TableIcon className="h-4 w-4 mr-1.5" /> {t("tabTables")}
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:warm-gradient-bg data-[state=active]:text-white">
            <ListOrdered className="h-4 w-4 mr-1.5" /> {t("tabOrders")}
          </TabsTrigger>
          <TabsTrigger value="reservations" className="data-[state=active]:warm-gradient-bg data-[state=active]:text-white">
            <CalendarDays className="h-4 w-4 mr-1.5" /> {t("tabReservations")}
          </TabsTrigger>
          <TabsTrigger value="stock" className="data-[state=active]:warm-gradient-bg data-[state=active]:text-white">
            <Boxes className="h-4 w-4 mr-1.5" /> {t("tabStock")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="mt-4">
          <MenuTab restaurantId={restaurantId} />
        </TabsContent>
        <TabsContent value="tables" className="mt-4">
          <TablesTab restaurantId={restaurantId} />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <OrdersTab restaurantId={restaurantId} />
        </TabsContent>
        <TabsContent value="reservations" className="mt-4">
          <ReservationsTab restaurantId={restaurantId} />
        </TabsContent>
        <TabsContent value="stock" className="mt-4">
          <StockTab restaurantId={restaurantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatBlock({ icon: Icon, color, label, value, big }) {
  return (
    <div className="warm-card warm-card-hover rounded-2xl p-4 flex items-center gap-3">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-stone-500 truncate">{label}</div>
        <div className={big ? "text-xl font-black text-stone-900" : "text-2xl font-black text-stone-900"}>
          {value}
        </div>
      </div>
    </div>
  );
}
