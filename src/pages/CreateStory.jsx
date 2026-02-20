import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function CreateStory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("subscribers");
  const [uploading, setUploading] = useState(false);

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMediaUrl(file_url);
      toast.success("Média téléchargé");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!mediaUrl) {
      toast.error("Veuillez sélectionner un média");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await base44.entities.Story.create({
        creator_email: user.email,
        media_url: mediaUrl,
        caption: caption || null,
        visibility,
        expires_at: expiresAt.toISOString(),
      });

      toast.success("Story créée avec succès !");
      navigate(createPageUrl("Discover"));
    } catch (error) {
      toast.error("Erreur lors de la création de la story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-violet-600 mb-6 hover:text-violet-700"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <h1 className="text-2xl font-black mb-6">
        <span className="gradient-text">Créer une Story</span>
      </h1>

      <div className="space-y-4">
        {/* Media Upload */}
        <Card className="border-0 shadow-sm p-6">
          {mediaUrl ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-[9/16] bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                {mediaUrl.includes(".mp4") || mediaUrl.includes("video") ? (
                  <video src={mediaUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Story" className="w-full h-full object-cover" />
                )}
              </div>
              <label className="flex items-center justify-center gap-2 px-3 py-2 border border-violet-200 rounded-lg bg-violet-50 text-violet-600 cursor-pointer hover:bg-violet-100 transition-colors w-full">
                <Upload className="h-4 w-4" />
                {uploading ? "Téléchargement en cours..." : "Changer le média"}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 w-full aspect-[9/16] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
                  <p className="font-medium text-gray-700">Téléchargement...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-center px-4">
                    <p className="font-medium text-gray-700">Ajouter une photo ou vidéo</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, MP4 (Max 100MB)</p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </Card>

        {/* Caption */}
        <Card className="border-0 shadow-sm p-4">
          <Textarea
            placeholder="Ajouter un texte à votre story (optionnel)..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-2">{caption.length}/200</p>
        </Card>

        {/* Visibility */}
        <Card className="border-0 shadow-sm p-4">
          <label className="text-sm font-medium mb-2 block">Qui peut voir cette story ?</label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subscribers">Abonnés uniquement</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={handleCreateStory}
            disabled={loading || !mediaUrl}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publier la story
          </Button>
          <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}