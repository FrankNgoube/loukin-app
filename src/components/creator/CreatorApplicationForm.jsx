import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function CreatorApplicationForm({ user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    date_of_birth: "",
    phone_number: "",
    address_cameroon: "",
  });
  const [idDocument, setIdDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux (max 10MB)");
        return;
      }
      setIdDocument(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier l'âge
      const age = calculateAge(formData.date_of_birth);
      if (age < 21) {
        toast.error("Vous devez avoir au moins 21 ans pour devenir créateur");
        setLoading(false);
        return;
      }

      // Upload du document
      if (!idDocument) {
        toast.error("Veuillez télécharger votre pièce d'identité");
        setLoading(false);
        return;
      }

      setUploadProgress(30);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: idDocument });
      setUploadProgress(70);

      // Créer la demande
      await base44.entities.CreatorApplication.create({
        user_email: user.email,
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        age,
        phone_number: formData.phone_number,
        address_cameroon: formData.address_cameroon,
        id_document_url: file_url,
        status: "pending"
      });

      setUploadProgress(100);
      toast.success("Demande envoyée avec succès ! En attente de validation.");
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la demande");
      console.error(error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devenir créateur/créatrice</CardTitle>
        <CardDescription>
          Remplissez ce formulaire pour soumettre votre demande. Vous devez avoir au moins 21 ans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="date_of_birth">Date de naissance *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 21)).toISOString().split('T')[0]}
              required
            />
            {formData.date_of_birth && (
              <p className="text-xs text-muted-foreground mt-1">
                Âge: {calculateAge(formData.date_of_birth)} ans
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone_number">Numéro de téléphone (Cameroun) *</Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="+237 6XX XX XX XX"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="address_cameroon">Adresse au Cameroun *</Label>
            <Textarea
              id="address_cameroon"
              value={formData.address_cameroon}
              onChange={(e) => setFormData({ ...formData, address_cameroon: e.target.value })}
              placeholder="Ville, quartier, rue..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="id_document">Pièce d'identité ou passeport en cours de validité *</Label>
            <div className="mt-2">
              <Input
                id="id_document"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
                required
              />
              {idDocument && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {idDocument.name}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Formats acceptés: JPG, PNG, PDF (max 10MB)
            </p>
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Téléchargement en cours... {uploadProgress}%
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Votre demande sera examinée par notre équipe. Vous recevrez une notification une fois validée.
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Soumettre ma demande
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}