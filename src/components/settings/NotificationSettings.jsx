import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Users, Heart, MessageCircle, DollarSign, Gift, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings({ user }) {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      if (!user) return;
      const existing = await base44.entities.NotificationPreference.filter(
        { user_email: user.email }
      );
      if (existing.length > 0) {
        setPrefs(existing[0]);
      } else {
        // Create default preferences
        const newPrefs = {
          user_email: user.email,
          new_subscriber: true,
          new_like: true,
          new_comment: true,
          new_message: true,
          ppv_purchase: true,
          new_tip: true,
          subscription_expired: true,
        };
        const created = await base44.entities.NotificationPreference.create(newPrefs);
        setPrefs(created);
      }
    };
    loadPrefs();
  }, [user]);

  const handleToggle = async (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    try {
      await base44.entities.NotificationPreference.update(prefs.id, {
        [key]: !prefs[key],
      });
      toast.success("Préférence mise à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const notificationOptions = [
    {
      key: "new_subscriber",
      label: "Nouveaux abonnés",
      description: "Recevoir une notification quand quelqu'un s'abonne",
      icon: Users,
    },
    {
      key: "new_like",
      label: "Likes sur publications",
      description: "Recevoir une notification quand quelqu'un aime votre publication",
      icon: Heart,
    },
    {
      key: "new_comment",
      label: "Nouveaux commentaires",
      description: "Recevoir une notification quand quelqu'un commente votre publication",
      icon: MessageCircle,
    },
    {
      key: "new_message",
      label: "Nouveaux messages",
      description: "Recevoir une notification pour les messages directs",
      icon: MessageCircle,
    },
    {
      key: "new_tip",
      label: "Nouveaux pourboires",
      description: "Recevoir une notification quand quelqu'un vous envoie un pourboire",
      icon: Gift,
    },
    {
      key: "ppv_purchase",
      label: "Achats PPV",
      description: "Recevoir une notification quand quelqu'un achète votre contenu",
      icon: DollarSign,
    },
    {
      key: "subscription_expired",
      label: "Abonnement expiré",
      description: "Recevoir une notification quand votre abonnement expire",
      icon: AlertCircle,
    },
  ];

  if (!prefs) return null;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-violet-600" />
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Gérez vos préférences de notification</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationOptions.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-violet-100 rounded-lg mt-0.5">
                  <Icon className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={prefs[key] || false}
                onCheckedChange={() => handleToggle(key)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}