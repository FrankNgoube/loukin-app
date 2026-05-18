import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  listMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/entities";
import { CATEGORIES, formatFCFA } from "@/lib/restaurant";
import { useI18n } from "@/lib/i18n";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "plats",
  image_url: "",
  is_available: true,
  stock: "0",
  stock_unlimited: false,
};

export default function MenuTab({ restaurantId }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-menu", restaurantId],
    queryFn: () => listMenu(restaurantId),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      category: item.category || "plats",
      image_url: item.image_url || "",
      is_available: item.is_available !== false,
      stock: String(item.stock ?? 0),
      stock_unlimited: item.stock_unlimited === true,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      restaurant_id: restaurantId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      category: form.category,
      image_url: form.image_url.trim(),
      is_available: !!form.is_available,
      stock: form.stock_unlimited ? 0 : Number(form.stock) || 0,
      stock_unlimited: !!form.stock_unlimited,
    };
    try {
      if (editing) {
        try {
          await updateMenuItem(editing.id, payload);
        } catch {
          qc.setQueryData(["admin-menu", restaurantId], (old = []) =>
            old.map((x) => (x.id === editing.id ? { ...x, ...payload } : x))
          );
        }
      } else {
        try {
          await createMenuItem(payload);
        } catch {
          qc.setQueryData(["admin-menu", restaurantId], (old = []) => [
            { id: `local-${Date.now()}`, ...payload },
            ...old,
          ]);
        }
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-menu", restaurantId] });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteMenuItem(item.id);
    } catch {
      qc.setQueryData(["admin-menu", restaurantId], (old = []) =>
        old.filter((x) => x.id !== item.id)
      );
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-menu", restaurantId] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-stone-500">
          {items.length} {t("tabMenu").toLowerCase()}
        </div>
        <Button onClick={openCreate} className="warm-gradient-bg text-white border-0">
          <Plus className="h-4 w-4 mr-1.5" /> {t("addItem")}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="warm-card rounded-2xl overflow-hidden flex flex-col">
            <div className="aspect-video bg-amber-50 overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {item.emoji || "🍲"}
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-stone-900">{item.name}</div>
                <div className="text-sm font-black text-red-700">{formatFCFA(item.price)}</div>
              </div>
              {item.description && (
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="chip bg-amber-100 text-amber-800">
                  {t(item.category) || item.category}
                </span>
                {item.stock_unlimited ? (
                  <span className="chip bg-emerald-100 text-emerald-800">∞ {t("stock")}</span>
                ) : (
                  <span className="chip bg-stone-100 text-stone-700">
                    {t("stock")}: {item.stock ?? 0}
                  </span>
                )}
                {!item.is_available && (
                  <span className="chip bg-red-100 text-red-700">{t("soldOut")}</span>
                )}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> {t("editItem")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-700"
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("editItem") : t("addItem")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label={t("name")}>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label={t("description")}>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("price")}>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
              <Field label={t("category")}>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.emoji} {t(c.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("imageUrl")}>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-semibold text-sm">{t("stockUnlimited")}</div>
              </div>
              <Switch
                checked={form.stock_unlimited}
                onCheckedChange={(v) => setForm({ ...form, stock_unlimited: v })}
              />
            </div>
            {!form.stock_unlimited && (
              <Field label={t("stock")}>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </Field>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="font-semibold text-sm">{t("available")}</div>
              <Switch
                checked={form.is_available}
                onCheckedChange={(v) => setForm({ ...form, is_available: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
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
