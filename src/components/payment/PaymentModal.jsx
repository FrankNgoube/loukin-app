import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  creatorEmail, 
  transactionType,
  contentId,
  subscriptionTierId,
  onSuccess 
}) {
  const [step, setStep] = useState('form'); // form | processing | success | error
  const [provider, setProvider] = useState('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [countdown, setCountdown] = useState(120);

  useEffect(() => {
    if (step === 'processing') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep('error');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'processing' && transactionId) {
      const checkInterval = setInterval(async () => {
        try {
          const { data } = await base44.functions.invoke('checkPaymentStatus', { transaction_id: transactionId });
          
          if (data.status === 'completed') {
            clearInterval(checkInterval);
            setStep('success');
            if (onSuccess) onSuccess();
          } else if (data.status === 'failed') {
            clearInterval(checkInterval);
            setStep('error');
          }
        } catch (error) {
          console.error('Erreur vérification:', error);
        }
      }, 3000);

      return () => clearInterval(checkInterval);
    }
  }, [step, transactionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const phoneRegex = /^(237)?[6][0-9]{8}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Format invalide. Ex: 237 6XX XXX XXX ou 6XX XXX XXX');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('initiatePayment', {
        creator_email: creatorEmail,
        transaction_type: transactionType,
        amount: amount,
        payment_provider: provider,
        phone_number: cleanPhone,
        content_id: contentId,
        subscription_tier_id: subscriptionTierId
      });

      setTransactionId(data.transaction_id);
      setStep('processing');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setStep('form');
    setPhoneNumber('');
    setCountdown(120);
    setTransactionId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' && '💳 Débloquer ce contenu'}
            {step === 'processing' && '⏳ Paiement en cours...'}
            {step === 'success' && '✅ Paiement réussi !'}
            {step === 'error' && '❌ Paiement échoué'}
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-violet-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-violet-700">{amount.toLocaleString()} FCFA</p>
              <p className="text-xs text-muted-foreground mt-1">Commission 20% incluse</p>
            </div>

            <div className="space-y-3">
              <Label>Moyen de paiement</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider('orange_money')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    provider === 'orange_money'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🟠</div>
                  <div className="text-xs font-semibold">Orange Money</div>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('mtn_momo')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    provider === 'mtn_momo'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🟡</div>
                  <div className="text-xs font-semibold">MTN MoMo</div>
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="6XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ℹ️ Vous recevrez une notification USSD sur votre téléphone
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Payer ${amount.toLocaleString()} FCFA`}
              </Button>
            </div>
          </form>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="space-y-4 text-center py-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-violet-600" />
            <div>
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-semibold">Vérifiez votre téléphone</p>
              <p className="text-sm text-muted-foreground">
                Un code USSD a été envoyé au<br />
                <span className="font-mono font-bold">+{phoneNumber}</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Composez votre code PIN pour confirmer
            </p>
            <div className="text-lg font-bold text-violet-600">
              Temps restant : {formatTime(countdown)}
            </div>
            <Button variant="outline" onClick={handleClose} size="sm">
              Annuler le paiement
            </Button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <div>
              <p className="text-xl font-bold mb-2">🎉 Contenu déverrouillé !</p>
              <p className="text-sm text-muted-foreground">
                Votre paiement de {amount.toLocaleString()} FCFA a été confirmé
              </p>
            </div>
            <Button onClick={handleClose} className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
              Voir le contenu maintenant 🎬
            </Button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="space-y-4 text-center py-6">
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <div>
              <p className="text-xl font-bold mb-2">Paiement échoué</p>
              <p className="text-sm text-muted-foreground">
                Le paiement n'a pas abouti. Vérifiez votre solde et réessayez.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button onClick={() => setStep('form')} className="flex-1">
                Réessayer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}