import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, MapPin, Users, Image, MessageCircle, ExternalLink, Eye, UserCheck, Clock } from "lucide-react";
import TierCard from "@/components/creator/TierCard";
import PostCard from "@/components/feed/PostCard.jsx";
import PaymentModal from "@/components/payment/PaymentModal";
import { toast } from "sonner";

export default function CreatorProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const creatorId = urlParams.get("id");
  const creatorEmail = urlParams.get("email");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showSubscribersList, setShowSubscribersList] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: creator } = useQuery({
    queryKey: ["creator", creatorId, creatorEmail],
    queryFn: async () => {
      if (creatorEmail) {
        const profiles = await base44.entities.CreatorProfile.filter({ user_email: creatorEmail });
        return profiles[0] || null;
      }
      const all = await base44.entities.CreatorProfile.filter({});
      return all.find(c => c.id === creatorId) || null;
    },
    enabled: !!creatorId || !!creatorEmail,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["tiers", creator?.user_email],
    queryFn: () => base44.entities.SubscriptionTier.filter({ creator_email: creator.user_email, is_active: true }),
    enabled: !!creator,
  });

  const { data: allPostsForCheck = [] } = useQuery({
    queryKey: ["all-creator-posts-check", creator?.user_email],
    queryFn: async () => {
      if (!creator) return [];
      const allPosts = await base44.entities.Post.filter({ creator_email: creator.user_email });
      return allPosts;
    },
    enabled: !!creator,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["creator-posts", creator?.user_email],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.filter({ creator_email: creator.user_email }, "-created_date", 50);
      return allPosts.filter(p => p.status === "published");
    },
    enabled: !!creator,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subs", user?.email, creator?.user_email],
    queryFn: () => base44.entities.Subscription.filter({ fan_email: user.email, creator_email: creator.user_email, status: "active" }),
    enabled: !!user && !!creator,
  });

  const { data: allSubscribers = [] } = useQuery({
    queryKey: ["all-subscribers", creator?.user_email],
    queryFn: () => base44.entities.Subscription.filter({ creator_email: creator?.user_email, status: "active" }),
    enabled: !!creator,
  });

  const currentSub = subscriptions[0];

  // Determine if creator profile is public PPV only
  const isPPVOnly = tiers.length === 0 && allPostsForCheck.some(p => p.is_ppv);
  const shouldRequirePayment = tiers.length > 0 && !isPPVOnly;

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const handleSubscribe = async (tier) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    // Free subscription for PPV-only public profiles
    if (!shouldRequirePayment) {
      try {
        await base44.entities.Subscription.create({
          fan_email: user.email,
          creator_email: creator.user_email,
          tier_id: "free",
          tier_level: 0,
          tier_name: "Gratuit",
          status: "active",
          auto_renew: true,
          start_date: new Date().toISOString().split('T')[0],
        });

        // Send notification to creator
        await base44.entities.Notification.create({
          user_email: creator.user_email,
          type: "new_subscriber",
          title: "Nouvel abonné",
          message: `${user.full_name} s'est abonné à votre profil pour un abonnement gratuit.`,
          from_user_email: user.email,
          from_user_name: user.full_name,
        });

        toast.success("Abonnement gratuit activé !");
        queryClient.invalidateQueries({ queryKey: ["my-subs"] });
      } catch (error) {
        toast.error("Erreur lors de l'abonnement");
      }
      return;
    }

    // Paid subscription for creator profiles with tiers
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handleSubscribeOld = async (tier) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    await base44.entities.Subscription.create({
      fan_email: user.email,
      creator_email: creator.user_email,
      tier_id: tier.id,
      tier_level: tier.tier_level,
      tier_name: tier.name,
      amount_monthly: tier.price_monthly,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    await base44.entities.Transaction.create({
      payer_email: user.email,
      recipient_email: creator.user_email,
      type: "subscription",
      amount: tier.price_monthly,
      platform_fee: tier.price_monthly * 0.2,
      net_amount: tier.price_monthly * 0.8,
      description: `Abonnement ${tier.name}`,
      reference_id: tier.id,
    });
    window.location.reload();
  };

  const isLocked = (post) => {
    if (user?.role === "admin") return false;
    if (post.visibility === "public") return false;
    if (user?.email === creator.user_email) return false;
    if (!currentSub && post.visibility !== "public") return true;
    if (currentSub) {
      const subEndDate = new Date(currentSub.end_date);
      const now = new Date();
      if (subEndDate < now) return true; // Abonnement expiré
      if (post.visibility === "tier_specific" && currentSub.tier_level < (post.required_tier_level || 1)) return true;
    }
    return false;
  };

  const handleUnsubscribe = async () => {
    if (!currentSub) return;
    try {
      await base44.entities.Subscription.update(currentSub.id, { status: "cancelled" });
      toast.success("Abonnement annulé avec succès");
      window.location.reload();
    } catch (err) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover */}
      <div className="relative h-44 md:h-56 bg-gradient-to-br from-violet-500 to-pink-500">
        {creator.cover_photo_url && (
          <img src={creator.cover_photo_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile info */}
      <div className="relative px-4 -mt-16 pb-4 border-b">
        <div className="flex items-end gap-4 mb-4">
          <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
            <AvatarImage src={creator.profile_picture_url} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-3xl font-bold">
              {creator.display_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black">{creator.display_name}</h1>
              {creator.is_verified && <CheckCircle className="h-5 w-5 text-violet-500 fill-violet-100" />}
            </div>
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          </div>
        </div>

        {creator.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" /> {creator.location}
          </div>
        )}
        {creator.bio && <p className="text-sm text-gray-700 mb-3">{creator.bio}</p>}

        <div className="flex gap-5 text-sm mb-4">
          <div className="text-center">
            <p className="font-bold">{posts.length || 0}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{allSubscribers.length || 0}</p>
            <p className="text-xs text-muted-foreground">Abonnés</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{posts.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0}</p>
            <p className="text-xs text-muted-foreground">Vues totales</p>
          </div>
        </div>

        {/* External links */}
        {creator.external_links?.length > 0 && (
          <div className="flex gap-2 mb-4">
            {creator.external_links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="gap-1 text-xs cursor-pointer hover:bg-violet-50">
                  <ExternalLink className="h-3 w-3" /> {link.platform}
                </Badge>
              </a>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {user?.email !== creator.user_email && (
          <div className="flex gap-2 flex-wrap">
            {currentSub ? (
              <>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1.5 gap-1">
                  <UserCheck className="h-3 w-3" /> Abonné · {currentSub.tier_name}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleUnsubscribe}
                >
                  Se désabonner
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                  onClick={() => handleSubscribe(tiers[0])}
                >
                  S'abonner
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" className="gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> Message
            </Button>
          </div>
        )}
      </div>

      {/* About section */}
      {creator.bio && (
        <div className="p-4 border-b">
          <h2 className="font-bold text-sm mb-2">À propos</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{creator.bio}</p>
        </div>
      )}

      {/* Subscribers section */}
      {user?.email === creator.user_email && (
        <div className="p-4 border-b">
          <button
            onClick={() => setShowSubscribersList(!showSubscribersList)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Mes abonnés ({allSubscribers.length})
            </h2>
          </button>
          {showSubscribersList && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {allSubscribers.length > 0 ? (
                allSubscribers.map((sub) => (
                  <div key={sub.id} className="text-xs p-2 rounded-lg bg-gray-50 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sub.fan_email}</p>
                      <p className="text-muted-foreground">{sub.tier_name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Pas d'abonnés encore</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tiers */}
      {tiers.length > 0 && !currentSub && user?.email !== creator.user_email && (
        <div className="p-4 border-b">
          <h2 className="font-bold text-sm mb-3">Niveaux d'abonnement</h2>
          <div className="grid gap-3">
            {tiers.sort((a, b) => a.tier_level - b.tier_level).map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                onSubscribe={handleSubscribe}
                popular={tier.tier_level === 2}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-4">
        <TabsList className="bg-gray-100 rounded-xl w-full p-1 mb-4">
          <TabsTrigger value="posts" className="flex-1 rounded-lg text-xs">Posts</TabsTrigger>
          <TabsTrigger value="photos" className="flex-1 rounded-lg text-xs">Photos</TabsTrigger>
          <TabsTrigger value="videos" className="flex-1 rounded-lg text-xs">Vidéos</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 pb-8">
          {posts.map(post => (
            <PostCard key={post.id} post={post} creator={creator} isLocked={isLocked(post)} currentUserEmail={user?.email} />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Image className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun post pour le moment</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="pb-8">
          <div className="grid grid-cols-3 gap-1">
            {posts.filter(p => p.content_type === "photo").map(post => (
              <div key={post.id} className="aspect-square bg-gray-100 rounded overflow-hidden relative">
                {isLocked(post) ? (
                  <div className="w-full h-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                ) : (
                  post.media_urls?.[0] && <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="pb-8">
          <div className="grid grid-cols-2 gap-2">
            {posts.filter(p => p.content_type === "video").map(post => (
              <div key={post.id} className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                {isLocked(post) ? (
                  <div className="w-full h-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                ) : (
                  post.thumbnail_url && <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Modal for Subscription */}
      {selectedTier && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTier(null);
          }}
          amount={selectedTier.price_monthly}
          creatorEmail={creator?.user_email}
          transactionType="subscription"
          subscriptionTierId={selectedTier.id}
          onSuccess={() => {
            toast.success("Abonnement activé !");
            window.location.reload();
          }}
        />
      )}

      {/* Tip Modal */}
      <PaymentModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        amount={5000}
        creatorEmail={creator?.user_email}
        transactionType="tip"
        onSuccess={() => {
          toast.success("Tip envoyé !");
          setShowTipModal(false);
        }}
      />
    </div>
  );
}