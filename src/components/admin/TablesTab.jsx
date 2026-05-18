import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, QrCode, ExternalLink, Trash2 } from "lucide-react";
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
} from "@/lib/entities";
import { buildMenuUrl, buildQrImageUrl } from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";

export default function TablesTab({ restaurantId }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: tables = [] } = useQuery({
    queryKey: ["admin-tables", restaurantId],
    queryFn: () => listTables(restaurantId),
  });

  const [newNumber, setNewNumber] = useState("");
  const [qrTable, setQrTable] = useState(null);
  const [saving, setSaving] = useState(false);

  const addTable = async () => {
    const n = Number(newNumber);
    if (!n) return;
    setSaving(true);
    const payload = {
      restaurant_id: restaurantId,
      table_number: n,
      is_active: true,
      qr_code_url: "",
    };
    try {
      try {
        await createTable(payload);
      } catch {
        qc.setQueryData(["admin-tables", restaurantId], (old = []) => [
          ...old,
          { id: `local-${Date.now()}`, ...payload },
        ]);
      }
      setNewNumber("");
      qc.invalidateQueries({ queryKey: ["admin-tables", restaurantId] });
    } finally {
      setSaving(false);
    }
  };

  const removeTable = async (tbl) => {
    if (!window.confirm(`#${tbl.table_number} ?`)) return;
    try {
      await deleteTable(tbl.id);
    } catch {
      qc.setQueryData(["admin-tables", restaurantId], (old = []) =>
        old.filter((x) => x.id !== tbl.id)
      );
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-tables", restaurantId] });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          type="number"
          inputMode="numeric"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          placeholder={t("tableNumber")}
          className="max-w-[180px]"
        />
        <Button
          onClick={addTable}
          disabled={!newNumber || saving}
          className="warm-gradient-bg text-white border-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> {t("addTable")}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tables.map((tbl) => {
          const url = buildMenuUrl({
            restaurantId,
            tableId: tbl.id,
            tableNumber: tbl.table_number,
          });
          return (
            <div key={tbl.id} className="warm-card rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-stone-500">{t("table")}</div>
                  <div className="text-3xl font-black text-stone-900">#{tbl.table_number}</div>
                </div>
                <button
                  onClick={() => removeTable(tbl)}
                  className="h-8 w-8 rounded-full hover:bg-red-50 flex items-center justify-center text-stone-400 hover:text-red-700"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setQrTable(tbl)}
                >
                  <QrCode className="h-4 w-4 mr-1.5" />
                  {t("showQr")}
                </Button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border bg-white text-stone-700 hover:bg-amber-50"
                  aria-label={t("open")}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!qrTable} onOpenChange={() => setQrTable(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("table")} #{qrTable?.table_number} · {t("qrCode")}
            </DialogTitle>
          </DialogHeader>
          {qrTable && (
            <div className="text-center">
              <div className="bg-white p-4 rounded-2xl border border-amber-200 inline-block">
                <img
                  src={buildQrImageUrl(
                    buildMenuUrl({
                      restaurantId,
                      tableId: qrTable.id,
                      tableNumber: qrTable.table_number,
                    })
                  )}
                  alt={`QR Table ${qrTable.table_number}`}
                  className="w-64 h-64"
                />
              </div>
              <div className="text-xs text-stone-500 mt-3 break-all">
                {buildMenuUrl({
                  restaurantId,
                  tableId: qrTable.id,
                  tableNumber: qrTable.table_number,
                })}
              </div>
              <div className="text-xs text-stone-500 mt-2">{t("qrHint")}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQrTable(null)}>
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
