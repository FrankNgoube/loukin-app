import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, Save, Plus, Trash2, LogOut, User, Palette, Bell, Shield, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import CreatorApplicationForm from "@/components/creator/CreatorApplicationForm";
import CreatorTermsModal from "@/components/creator/CreatorTermsModal";
import NotificationSettings from "@/components/settings/NotificationSettings";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [form, setForm] = useState({
    display_name: "",
    username: "",
    bio: "",
    category: "other",
    location: "",
    profile_picture_url: "",
    cover_photo_url: "",
    external_links: [],
  });

  const { data: application, refetch: refetchApplication } = useQuery({
    queryKey: ["creator-application", user?.email],
    queryFn: async () => {
      const apps = await base44.entities.CreatorApplication.filter({ user_email: user.email }, "-created_date", 1);
      return apps[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      // Check if creator terms are accepted
      const terms = await base44.entities.CreatorTerms.filter({ user_email: me.email });
      setTermsAccepted(terms.length > 0);
      
      const profiles = await base44.entities.CreatorProfile.filter({ user_email: me.email });
      if (profiles.length > 0) {
        const p = profiles[0];
        setProfile(p);
        setForm({
          display_name: p.display_name || "",
          username: p.username || "",
          bio: p.bio || "",
          category: p.category || "other",
          location: p.location || "",
          profile_picture_url: p.profile_picture_url || "",
          cover_photo_url: p.cover_photo_url || "",
          external_links: p.external_links || [],
        });
      } else {
        setForm(prev => ({
          ...prev,
          display_name: me.full_name || "",
          username: me.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, ""),
        }));
      }
      const t = await base44.entities.SubscriptionTier.filter({ creator_email: me.email });
      setTiers(t);
    };
    init();
  }, []);

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, [field]: file_url }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const data = { ...form, user_email: user.email };
    if (profile) {
      await base44.entities.CreatorProfile.update(profile.id, data);
    } else {
      await base44.entities.CreatorProfile.create(data);
    }
    toast.success("Profil sauvegardé !");
    setSaving(false);
    window.location.reload();
  };

  const addTier = () => {
    setTiers(prev => [...prev, {
      _isNew: true,
      creator_email: user.email,
      name: "",
      tier_level: prev.length + 1,
      price_monthly: 0,
      benefits: [],
      content_access_percent: 30,
      is_active: true,
    }]);
  };

  const saveTier = async (tier, index) => {
    const data = { ...tier };
    delete data._isNew;
    delete data.id;
    delete data.created_date;
    delete data.updated_date;
    delete data.created_by;

    if (tier._isNew) {
      const created = await base44.entities.SubscriptionTier.create(data);
      const updated = [...tiers];
      updated[index] = created;
      setTiers(updated);
    } else {
      await base44.entities.SubscriptionTier.update(tier.id, data);
    }
    toast.success("Tier sauvegardé !");
  };

  const deleteTier = async (tier, index) => {
    if (tier.id && !tier._isNew) {
      await base44.entities.SubscriptionTier.delete(tier.id);
    }
    setTiers(prev => prev.filter((_, i) => i !== index));
    toast.success("Tier supprimé");
  };

  const updateTier = (index, field, value) => {
    setTiers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
      <h1 className="text-2xl font-black mb-5"><span className="gradient-text">Paramètres</span></h1>

      <Tabs defaultValue={profile ? "profile" : "creator"}>
        <TabsList className="bg-gray-100 rounded-xl p-1 mb-5 w-full">
          {!profile && <TabsTrigger value="creator" className="flex-1 rounded-lg text-xs gap-1"><User className="h-3 w-3" /> Devenir créateur</TabsTrigger>}
          {profile && <TabsTrigger value="profile" className="flex-1 rounded-lg text-xs gap-1"><User className="h-3 w-3" /> Profil</TabsTrigger>}
          {profile && <TabsTrigger value="tiers" className="flex-1 rounded-lg text-xs gap-1"><DollarSign className="h-3 w-3" /> Abonnements</TabsTrigger>}
          <TabsTrigger value="notifications" className="flex-1 rounded-lg text-xs gap-1"><Bell className="h-3 w-3" /> Notifications</TabsTrigger>
          <TabsTrigger value="account" className="flex-1 rounded-lg text-xs gap-1"><Shield className="h-3 w-3" /> Compte</TabsTrigger>
        </TabsList>

        {/* Creator Application Tab */}
        {!profile && (
          <TabsContent value="creator" className="space-y-4">
            {!application && !showApplicationForm && (
              <Card className="border-0 shadow-sm p-6 text-center">
                <div className="mb-4">
                  <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Devenez créateur/créatrice</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Partagez votre contenu et monétisez votre créativité sur LouKin.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    if (!termsAccepted) {
                      setShowTermsModal(true);
                    } else {
                      setShowApplicationForm(true);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-violet-600 to-pink-600"
                >
                  Commencer ma demande
                </Button>
              </Card>
            )}
            
            {showApplicationForm && !application && (
              <CreatorApplicationForm 
                user={user} 
                onSuccess={() => {
                  setShowApplicationForm(false);
                  refetchApplication();
                }}
              />
            )}

            {application && (
              <Card className="border-0 shadow-sm p-6">
                <div className="text-center mb-4">
                  {application.status === "pending" && (
                    <>
                      <Clock className="h-12 w-12 mx-auto mb-3 text-orange-500" />
                      <h3 className="text-lg font-bold mb-2">Demande en cours de traitement</h3>
                      <p className="text-sm text-muted-foreground">
                        Votre demande a été reçue et est actuellement en cours d'examen par notre équipe. Vous recevrez une notification dès qu'elle sera validée.
                      </p>
                    </>
                  )}
                  {application.status === "approved" && (
                    <>
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <h3 className="text-lg font-bold mb-2">Demande approuvée !</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Félicitations ! Vous pouvez maintenant configurer votre profil créateur.
                      </p>
                      <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-violet-600 to-pink-600">
                        Configurer mon profil
                      </Button>
                    </>
                  )}
                  {application.status === "rejected" && (
                    <>
                      <XCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                      <h3 className="text-lg font-bold mb-2">Demande refusée</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Nous sommes désolés mais votre demande n'a pas été acceptée.
                      </p>
                      {application.rejection_reason && (
                        <p className="text-xs bg-red-50 text-red-800 p-3 rounded-lg mb-4">
                          Raison: {application.rejection_reason}
                        </p>
                      )}
                      <Button 
                        onClick={() => setShowApplicationForm(true)} 
                        variant="outline"
                      >
                        Soumettre une nouvelle demande
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Profile Tab */}
        {profile && (
          <TabsContent value="profile" className="space-y-4">

          {/* Avatar & Cover */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="relative h-32 bg-gradient-to-br from-violet-500 to-pink-500">
              {form.cover_photo_url && <img src={form.cover_photo_url} alt="" className="w-full h-full object-cover" />}
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "cover_photo_url")} />
              </label>
            </div>
            <div className="px-4 -mt-10 pb-4">
              <div className="relative inline-block">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage src={form.profile_picture_url} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xl font-bold">
                    {form.display_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center cursor-pointer shadow-lg">
                  <Camera className="h-3.5 w-3.5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "profile_picture_url")} />
                </label>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Nom d'affichage *</Label>
                <Input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} placeholder="Votre nom public" />
              </div>
              <div>
                <Label>Nom d'utilisateur *</Label>
                <Input value={form.username} onChange={e => setForm({...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")})} placeholder="nomutilisateur" />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Parlez de vous..." rows={4} />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="music">Musique</SelectItem>
                    <SelectItem value="cooking">Cuisine</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="fashion">Mode</SelectItem>
                    <SelectItem value="photography">Photo</SelectItem>
                    <SelectItem value="education">Éducation</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="travel">Voyage</SelectItem>
                    <SelectItem value="comedy">Comédie</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Localisation</Label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Votre ville" />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Sauvegarde..." : profile ? "Sauvegarder les modifications" : "Créer mon profil créateur"}
            </Button>
          </Card>
          </TabsContent>
        )}

        {/* Tiers Tab */}
        {profile && (
          <TabsContent value="tiers" className="space-y-4">
            <Card className="border-0 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold">Paliers d'abonnement</h3>
                  <p className="text-xs text-muted-foreground">Créez différents niveaux pour vos fans</p>
                </div>
                <Button onClick={addTier} size="sm" className="bg-violet-600">
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </Button>
              </div>

              {tiers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun palier créé. Ajoutez-en un pour commencer !
                </div>
              )}

              <div className="space-y-3">
                {tiers.map((tier, i) => (
                  <Card key={i} className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Nom du palier" value={tier.name} onChange={e => updateTier(i, "name", e.target.value)} />
                      <Input type="number" placeholder="Prix" value={tier.price_monthly} onChange={e => updateTier(i, "price_monthly", Number(e.target.value))} className="w-28" />
                    </div>
                    <Textarea placeholder="Avantages (un par ligne)" value={tier.benefits?.join("\n") || ""} onChange={e => updateTier(i, "benefits", e.target.value.split("\n").filter(Boolean))} rows={3} />
                    <div className="flex gap-2">
                      <Button onClick={() => saveTier(tier, i)} size="sm" className="flex-1">
                        <Save className="h-3 w-3 mr-1" /> Sauvegarder
                      </Button>
                      <Button onClick={() => deleteTier(tier, i)} size="sm" variant="destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings user={user} />
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card className="border-0 shadow-sm p-5">
            <h3 className="font-bold mb-4">Informations du compte</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nom complet</Label>
                <p className="font-medium">{user.full_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rôle</Label>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-5">
            <Button onClick={() => base44.auth.logout()} variant="destructive" className="w-full">
              <LogOut className="h-4 w-4 mr-2" /> Déconnexion
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      <CreatorTermsModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowApplicationForm(true);
        }}
      />
    </div>
  );
}