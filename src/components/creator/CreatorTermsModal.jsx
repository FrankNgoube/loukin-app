import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CreatorTermsModal({ isOpen, onClose, onAccept }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      toast.error("Vous devez accepter les conditions générales");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.CreatorTerms.create({
        user_email: user.email,
        accepted_at: new Date().toISOString(),
      });
      toast.success("Conditions acceptées");
      onAccept();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'acceptation des conditions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conditions Générales - Créateurs de Contenu</DialogTitle>
          <DialogDescription>Lisez et acceptez les conditions avant de continuer</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="prose prose-sm max-w-none">
            <h3 className="font-semibold mt-4">1. Contenu Privé et Monétisation</h3>
            <p className="text-sm text-gray-700">
              En tant que créateur, vous pouvez publier du contenu privé accessible uniquement à vos abonnés payants. La monétisation du contenu est réservée aux comptes créateurs vérifiés.
            </p>

            <h3 className="font-semibold mt-4">2. Responsabilité du Contenu</h3>
            <p className="text-sm text-gray-700">
              Vous êtes responsable de tout contenu que vous publiez. Le contenu doit être légal et respecter les droits d'auteur. La plateforme se réserve le droit de supprimer les contenus non conformes.
            </p>

            <h3 className="font-semibold mt-4">3. Vérification de l'Identité</h3>
            <p className="text-sm text-gray-700">
              Pour monétiser votre contenu, vous devez fournir des informations personnelles vérifiables. Ces informations seront traitées conformément à notre politique de confidentialité.
            </p>

            <h3 className="font-semibold mt-4">4. Droits et Révocation</h3>
            <p className="text-sm text-gray-700">
              La plateforme se réserve le droit de révoquer le statut de créateur en cas de violation des présentes conditions ou des lois applicables.
            </p>

            <h3 className="font-semibold mt-4">5. Rémunération et Frais</h3>
            <p className="text-sm text-gray-700">
              Une commission de 20% est prélevée sur les revenus générés par votre contenu. Les détails des paiements seront disponibles dans votre tableau de bord.
            </p>

            <h3 className="font-semibold mt-4">6. Conformité Légale</h3>
            <p className="text-sm text-gray-700">
              En tant que créateur, vous êtes responsable du respect de toutes les lois et réglementations applicables dans votre juridiction, y compris les obligations fiscales.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox 
              id="accept-terms"
              checked={accepted}
              onCheckedChange={setAccepted}
            />
            <Label htmlFor="accept-terms" className="text-sm font-medium cursor-pointer">
              J'accepte les conditions générales et les politiques de la plateforme
            </Label>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={!accepted || loading}
            className="bg-gradient-to-r from-violet-600 to-pink-600"
          >
            {loading ? "Acceptation..." : "Accepter et Continuer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}