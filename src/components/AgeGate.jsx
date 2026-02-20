import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function AgeGate({ children }) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ageVerified = localStorage.getItem("age_verified");
    if (ageVerified === "true") {
      setVerified(true);
    }
    setLoading(false);
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("age_verified", "true");
    setVerified(true);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  if (loading) return null;

  if (!verified) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black gradient-text">Vérification de l'âge</CardTitle>
            <CardDescription className="text-base mt-2">
              Contenu réservé aux adultes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-red-900 mb-2">⚠️ AVERTISSEMENT</p>
              <p className="text-red-800 mb-2">
                Ce site contient du contenu pour adultes destiné uniquement aux personnes âgées de 21 ans et plus.
              </p>
              <p className="text-red-800">
                En continuant, vous confirmez que vous avez au moins 21 ans et que vous acceptez de voir ce type de contenu.
              </p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground bg-gray-50 rounded-xl p-3">
              <p>• Vous devez avoir au moins 21 ans pour accéder à ce site</p>
              <p>• Le contenu peut être de nature explicite</p>
              <p>• Vous êtes responsable du respect des lois locales</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 h-11"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                J'ai 21 ans ou plus - Entrer
              </Button>
              <Button 
                onClick={handleDecline}
                variant="outline"
                className="w-full h-11"
              >
                J'ai moins de 21 ans - Quitter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}