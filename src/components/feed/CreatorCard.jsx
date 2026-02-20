import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Image, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CreatorCard({ creator }) {
  const [subscribing, setSubscribing] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentSubId, setCurrentSubId] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(creator.total_subscribers || 0);

  React.useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
      if (me) {
        base44.entities.Subscription.filter({ fan_email: me.email, creator_email: creator.user_email, status: "active" }).then(subs => {
          if (subs.length > 0) {
            setIsSubscribed(true);
            setCurrentSubId(subs[0].id);
          }
        });
      }
    }).catch(() => { });
  }, [creator.user_email]);

  const handleToggleSubscribe = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Connectez-vous pour vous abonner");
      return;
    }

    setSubscribing(true);
    try {
      if (isSubscribed && currentSubId) {
        // Optimistic UI updates
        setIsSubscribed(false);
        setSubscriberCount(prev => Math.max(0, prev - 1));

        await base44.entities.Subscription.update(currentSubId, { status: "cancelled" });
        setCurrentSubId(null);
        toast.success("Désabonnement réussi");
      } else {
        // Optimistic UI updates
        setIsSubscribed(true);
        setSubscriberCount(prev => prev + 1);

        // Create free subscription
        const newSub = await base44.entities.Subscription.create({
          fan_email: user.email,
          creator_email: creator.user_email,
          tier_id: "free",
          tier_level: 0,
          tier_name: "Free",
          amount_monthly: 0,
          status: "active",
          auto_renew: true,
          start_date: new Date().toISOString().split('T')[0]
        });
        setCurrentSubId(newSub.id);

        // Send notification to creator
        await base44.entities.Notification.create({
          user_email: creator.user_email,
          type: "new_subscriber",
          title: "Nouvel abonné",
          message: `${user.full_name} s'est abonné à votre profil`,
          from_user_email: user.email,
          from_user_name: user.full_name,
        });

        toast.success("Vous êtes maintenant abonné!");
      }
    } catch (error) {
      toast.error("Erreur, veuillez réessayer");
      // Revert optimistic updates
      setIsSubscribed(!isSubscribed);
      setSubscriberCount(isSubscribed ? subscriberCount + 1 : Math.max(0, subscriberCount - 1));
    } finally {
      setSubscribing(false);
    }
  };
  return (
    <Card className="overflow-hidden border-0 bg-transparent glass-panel interactive-card group">
      {/* Cover */}
      <div className="relative h-28 bg-gradient-to-br from-violet-500 to-pink-500">
        {creator.cover_photo_url && (
          <img src={creator.cover_photo_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Avatar */}
      <Link to={createPageUrl("CreatorProfile") + `?email=${creator.user_email}`} className="relative px-5 -mt-10 block hover:opacity-90 transition-opacity z-10">
        <div className="inline-block rounded-full bg-white/30 p-1 backdrop-blur-sm shadow-xl">
          <Avatar className="h-16 w-16 ring-4 ring-white shadow-sm cursor-pointer">
            <AvatarImage src={creator.profile_picture_url} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xl font-bold">
              {creator.display_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 pt-2 space-y-3">
        <Link to={createPageUrl("CreatorProfile") + `?email=${creator.user_email}`} className="block hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm truncate">{creator.display_name}</h3>
            {creator.is_verified && <CheckCircle className="h-3.5 w-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">@{creator.username}</p>
        </Link>

        {creator.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2">{creator.bio}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{subscriberCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            <span>{creator.total_posts || 0} posts</span>
          </div>
        </div>

        {creator.category && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{creator.category}</Badge>
        )}

        <Button
          onClick={handleToggleSubscribe}
          disabled={subscribing || !user || user?.email === creator.user_email}
          variant={isSubscribed ? "outline" : "default"}
          className={cn("w-full font-semibold h-[42px] rounded-xl text-sm disabled:opacity-50 transition-all duration-300",
            !isSubscribed && "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
          )}
        >
          {subscribing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              En cours...
            </>
          ) : isSubscribed ? (
            "Se désabonner"
          ) : (
            "S'abonner"
          )}
        </Button>
      </div>
    </Card>
  );
}