import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatFCFA } from "@/lib/restaurant";

export default function OrderConfirmation() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const orderId = params.get("order_id") || "";
  const tableNumber = params.get("table_number") || "";
  const total = Number(params.get("total") || 0);

  const menuParams = new URLSearchParams();
  if (tableNumber) menuParams.set("table_number", tableNumber);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-stone-50 px-4">
      <div className="warm-card rounded-3xl p-8 max-w-md w-full text-center">
        <div className="h-20 w-20 mx-auto rounded-full warm-gradient-bg flex items-center justify-center shadow-xl mb-5 pulse-ring">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-black warm-gradient-text">{t("confirmationTitle")}</h1>
        <p className="text-stone-600 mt-2">{t("confirmationText")}</p>

        <div className="mt-6 space-y-2 text-sm">
          {tableNumber && (
            <div className="flex justify-between bg-amber-50 rounded-xl px-4 py-2">
              <span className="text-stone-500">{t("table")}</span>
              <span className="font-bold">#{tableNumber}</span>
            </div>
          )}
          {orderId && (
            <div className="flex justify-between bg-amber-50 rounded-xl px-4 py-2">
              <span className="text-stone-500">{t("orderNumber")}</span>
              <span className="font-mono text-xs">{orderId.slice(-8).toUpperCase()}</span>
            </div>
          )}
          {total > 0 && (
            <div className="flex justify-between bg-red-50 rounded-xl px-4 py-3">
              <span className="text-stone-700 font-semibold">{t("total")}</span>
              <span className="font-black text-red-700 text-lg">{formatFCFA(total)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-stone-500">💵 {t("paymentCash")}</div>

        <Link
          to={`/ClientMenu?${menuParams.toString()}`}
          className="block mt-6"
        >
          <Button className="w-full warm-gradient-bg text-white border-0 h-12 font-bold">
            {t("backToMenuBtn")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
