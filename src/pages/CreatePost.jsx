import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Video, X, Send, Eye, Lock, DollarSign } from "lucide-react";

export default function CreatePost() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    caption: "",
    content_type: "mixed",
    media_urls: [],
    visibility: "subscribers",
    required_tier_level: 1,
    is_ppv: false,
    ppv_price: 0,
    tags: [],
    allow_comments: true,
    allow_download: false,
    status: "published",
  });

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.CreatorProfile.filter({ user_email: me.email });
      if (profiles.length > 0) setCreatorProfile(profiles[0]);
    };
    init();
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const urls = [];
    let hasVideo = false;
    let hasPhoto = false;
    
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
      if (file.type.startsWith('video/')) {
        hasVideo = true;
      } else if (file.type.startsWith('image/')) {
        hasPhoto = true;
      }
    }
    
    // Determine content type based on files uploaded
    let contentType = form.content_type;
    if (hasVideo && hasPhoto) {
      contentType = 'mixed';
    } else if (hasVideo) {
      contentType = 'video';
    } else if (hasPhoto) {
      contentType = 'photo';
    }
    
    setForm(prev => ({ ...prev, media_urls: [...prev.media_urls, ...urls], content_type: contentType }));
    setUploading(false);
  };

  const removeMedia = (index) => {
    setForm(prev => ({ ...prev, media_urls: prev.media_urls.filter((_, i) => i !== index) }));
  };

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async () => {
    if (!creatorProfile) return;
    setSubmitting(true);
    await base44.entities.Post.create({
      ...form,
      creator_email: user.email,
    });
    // Update post count
    await base44.entities.CreatorProfile.update(creatorProfile.id, {
      total_posts: (creatorProfile.total_posts || 0) + 1,
    });
    setSubmitting(false);
    navigate(createPageUrl("MyProfile"));
  };

  if (!creatorProfile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
          <ImagePlus className="h-8 w-8 text-violet-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Devenez créateur</h2>
        <p className="text-sm text-muted-foreground mb-4">Créez votre profil créateur pour publier du contenu</p>
        <Button onClick={() => navigate(createPageUrl("Settings"))} className="bg-gradient-to-r from-violet-600 to-pink-600">
          Créer mon profil
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 lg:py-8">
      <h1 className="text-xl font-black mb-5"><span className="gradient-text">Nouveau post</span></h1>

      <div className="space-y-5">
        {/* Caption */}
        <div>
          <Textarea
            placeholder="Écrivez votre légende..."
            value={form.caption}
            onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))}
            className="min-h-[100px] resize-none rounded-xl border-gray-200"
          />
        </div>

        {/* Media upload */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Médias</Label>
          <div className="grid grid-cols-3 gap-2">
            {form.media_urls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                {form.content_type === 'video' ? (
                  <video src={url} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-all">
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileUpload} />
              {uploading ? (
                <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-400">Ajouter</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Content type */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Type de contenu</Label>
          <Select value={form.content_type} onValueChange={v => setForm(prev => ({ ...prev, content_type: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">📸 Photo</SelectItem>
              <SelectItem value="video">🎥 Vidéo</SelectItem>
              <SelectItem value="mixed">🎬 Mixte (photos + vidéos)</SelectItem>
              <SelectItem value="audio">🎵 Audio</SelectItem>
              <SelectItem value="text">📝 Texte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visibility */}
        <Card className="p-4 border-0 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-violet-600" />
            <Label className="text-sm font-medium">Visibilité</Label>
          </div>
          <Select value={form.visibility} onValueChange={v => setForm(prev => ({ ...prev, visibility: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public"><Eye className="h-3 w-3 inline mr-1" /> Public</SelectItem>
              <SelectItem value="subscribers"><Lock className="h-3 w-3 inline mr-1" /> Abonnés uniquement</SelectItem>
              <SelectItem value="tier_specific"><Lock className="h-3 w-3 inline mr-1" /> Tier spécifique</SelectItem>
            </SelectContent>
          </Select>

          {form.visibility === "tier_specific" && (
            <Select value={String(form.required_tier_level)} onValueChange={v => setForm(prev => ({ ...prev, required_tier_level: parseInt(v) }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Bronze (Niveau 1)</SelectItem>
                <SelectItem value="2">Silver (Niveau 2)</SelectItem>
                <SelectItem value="3">Gold (Niveau 3)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Card>

        {/* PPV */}
        <Card className="p-4 border-0 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-violet-600" />
              <Label className="text-sm font-medium">Pay-Per-View</Label>
            </div>
            <Switch checked={form.is_ppv} onCheckedChange={v => setForm(prev => ({ ...prev, is_ppv: v }))} />
          </div>
          {form.is_ppv && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="100"
                value={form.ppv_price}
                onChange={e => setForm(prev => ({ ...prev, ppv_price: parseFloat(e.target.value) || 0 }))}
                className="rounded-xl"
                placeholder="Prix en FCFA"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">FCFA</span>
            </div>
          )}
        </Card>

        {/* Tags */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Tags</Label>
          <Input
            placeholder="Ajouter un tag et appuyer Entrée"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
            className="rounded-xl mb-2"
          />
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1.5">
                #{tag}
                <button onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Options */}
        <Card className="p-4 border-0 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Autoriser les commentaires</Label>
            <Switch checked={form.allow_comments} onCheckedChange={v => setForm(prev => ({ ...prev, allow_comments: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Autoriser le téléchargement</Label>
            <Switch checked={form.allow_download} onCheckedChange={v => setForm(prev => ({ ...prev, allow_download: v }))} />
          </div>
        </Card>

        {/* Submit */}
        <Button
          className="w-full h-12 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-semibold rounded-xl gap-2"
          onClick={handleSubmit}
          disabled={submitting || (!form.caption && form.media_urls.length === 0)}
        >
          {submitting ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <><Send className="h-4 w-4" /> Publier</>
          )}
        </Button>
      </div>
    </div>
  );
}