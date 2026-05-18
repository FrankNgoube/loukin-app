import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Calendar, CheckCircle2, XCircle, Phone } from "lucide-react";
import {
  listReservations,
  createReservation,
  updateReservation,
} from "@/lib/entities";
import { isValidCameroonNumber, normalizeWhatsapp } from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_COLOR = {
  en_attente: "bg-amber-100 text-amber-800 border-amber-200",
  confirmee: "bg-emerald-100 text-emerald-800 border-emerald-200",
  annulee: "bg-stone-100 text-stone-600 border-stone-200",
};
const STATUS_LABEL = {
  fr: { en_attente: "En attente", confirmee: "Confirmée", annulee: "Annulée" },
  en: { en_attente: "Pending", confirmee: "Confirmed", annulee: "Cancelled" },
};

const empty = {
  client_name: "",
  whatsapp_number: "",
  date: "",
  time: "",
  number_of_people: "2",
  preferences: "",
  occasion: "",
};

export default function ReservationsTab({ restaurantId }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-reservations", restaurantId],
    queryFn: () => listReservations(restaurantId),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleStatus = async (r, status) => {
    try {
      await updateReservation(r.id, { status });
    } catch {
      qc.setQueryData(["admin-reservations", restaurantId], (old = []) =>
        old.map((x) => (x.id === r.id ? { ...x, status } : x))
      );
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-reservations", restaurantId] });
  };

  const handleCreate = async () => {
    setError("");
    if (!form.client_name.trim()) return setError("Nom requis");
    if (!isValidCameroonNumber(form.whatsapp_number)) {
      return setError("Numéro WhatsApp invalide (+237...)");
    }
    if (!form.date || !form.time) return setError("Date / heure requises");
    const payload = {
      restaurant_id: restaurantId,
      client_name: form.client_name.trim(),
      whatsapp_number: normalizeWhatsapp(form.whatsapp_number),
      date: form.date,
      time: form.time,
      number_of_people: Number(form.number_of_people) || 1,
      preferences: form.preferences.trim(),
      occasion: form.occasion.trim(),
      status: "en_attente",
      table_id: null,
    };
    setSaving(true);
    try {
      try {
        await createReservation(payload);
      } catch {
        qc.setQueryData(["admin-reservations", restaurantId], (old = []) => [
          { id: `local-${Date.now()}`, ...payload },
          ...old,
        ]);
      }
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["admin-reservations", restaurantId] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-stone-500">{items.length}</div>
        <Button onClick={() => setOpen(true)} className="warm-gradient-bg text-white border-0">
          <Plus className="h-4 w-4 mr-1.5" /> {t("addReservation")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-stone-500 py-12">📅 —</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((r) => (
            <div key={r.id} className="warm-card rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-stone-900">{r.client_name}</div>
                  <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {r.whatsapp_number}
                  </div>
                </div>
                <span className={cn("chip border", STATUS_COLOR[r.status] || STATUS_COLOR.en_attente)}>
                  {STATUS_LABEL[lang][r.status] || r.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-amber-50 rounded-lg p-2">
                  <div className="text-[10px] text-stone-500">{t("date")}</div>
                  <div className="font-bold">{r.date}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <div className="text-[10px] text-stone-500">{t("time")}</div>
                  <div className="font-bold">{r.time}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 col-span-2">
                  <div className="text-[10px] text-stone-500">{t("numberOfPeople")}</div>
                  <div className="font-bold">{r.number_of_people} pers.</div>
                </div>
              </div>
              {(r.preferences || r.occasion) && (
                <div className="mt-2 text-xs text-stone-600 space-y-1">
                  {r.occasion && <div>🎉 {r.occasion}</div>}
                  {r.preferences && <div>📝 {r.preferences}</div>}
                </div>
              )}
              {r.status !== "annulee" && (
                <div className="mt-3 flex gap-2">
                  {r.status !== "confirmee" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      onClick={() => handleStatus(r, "confirmee")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t("confirm")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    onClick={() => handleStatus(r, "annulee")}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> {t("annul")}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("addReservation")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label={t("clientName")}>
              <Input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </Field>
            <Field label={t("whatsappNumber")}>
              <Input
                value={form.whatsapp_number}
                onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                placeholder="+237 6XX XX XX XX"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("date")}>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
              <Field label={t("time")}>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t("numberOfPeople")}>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                value={form.number_of_people}
                onChange={(e) => setForm({ ...form, number_of_people: e.target.value })}
              />
            </Field>
            <Field label={t("occasion")}>
              <Input
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                placeholder="Anniversaire, dîner d'affaires..."
              />
            </Field>
            <Field label={t("preferences")}>
              <Textarea
                rows={2}
                value={form.preferences}
                onChange={(e) => setForm({ ...form, preferences: e.target.value })}
              />
            </Field>
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="warm-gradient-bg text-white border-0"
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-stone-600 mb-1">{label}</div>
      {children}
    </label>
  );
}
