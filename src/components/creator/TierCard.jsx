import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

const tierIcons = { 1: Star, 2: Gem, 3: Crown };
const tierColors = {
  1: "from-amber-500/20 to-orange-500/20 border-amber-200",
  2: "from-slate-300/20 to-slate-400/20 border-slate-300",
  3: "from-yellow-400/20 to-amber-400/20 border-yellow-300"
};

export default function TierCard({ tier, isSubscribed, onSubscribe, popular }) {
  const Icon = tierIcons[tier.tier_level] || Star;

  return (
    <Card className={cn(
      "relative overflow-hidden p-5 transition-all duration-300 hover:shadow-lg",
      `bg-gradient-to-br ${tierColors[tier.tier_level] || tierColors[1]}`,
      popular && "ring-2 ring-violet-500 scale-[1.02]"
    )}>
      {popular && (
        <Badge className="absolute top-3 right-3 bg-violet-600 text-white text-[10px]">Populaire</Badge>
      )}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-violet-600" />
        <h3 className="font-bold text-lg">{tier.name}</h3>
      </div>
      <div className="mb-4">
        <span className="text-3xl font-black">{tier.price_monthly.toLocaleString()} FCFA</span>
        <span className="text-sm text-muted-foreground">/mois</span>
      </div>
      <ul className="space-y-2 mb-5">
        {tier.benefits?.map((benefit, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <Button
        className={cn(
          "w-full font-semibold",
          isSubscribed
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
        )}
        onClick={() => !isSubscribed && onSubscribe?.(tier)}
        disabled={isSubscribed}
      >
        {isSubscribed ? "Abonné ✓" : "S'abonner"}
      </Button>
    </Card>
  );
}