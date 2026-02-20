import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Image, PlusSquare, Users, DollarSign, TrendingUp, CheckCircle, Video, Wallet, Bookmark, Repeat2, UserCheck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import PostCard from "@/components/feed/PostCard.jsx";
import PaymentModal from "@/components/payment/PaymentModal";

export default function MyProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get("email");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubscribersList, setShowSubscribersList] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleDeletePost = async (postId) => {
    if (!confirm("Voulez-vous vraiment supprimer ce post ?")) return;
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const isOtherUserProfile = profileEmail && profileEmail !== user?.email;
  const targetEmail = profileEmail || user?.email;

  const { data: profile } = useQuery({
    queryKey: ["my-profile", targetEmail],
    queryFn: async () => {
      const profiles = await base44.entities.CreatorProfile.filter({ user_email: targetEmail });
      return profiles[0] || null;
    },
    enabled: !!targetEmail,
  });

  const { data: userSubscriptions = [] } = useQuery({
    queryKey: ["user-subscriptions", user?.email, targetEmail],
    queryFn: () => base44.entities.Subscription.filter({ fan_email: user?.email, creator_email: targetEmail, status: "active" }),
    enabled: !!user && !!isOtherUserProfile,
  });

  const currentSub = userSubscriptions[0];

  const { data: posts = [] } = useQuery({
    queryKey: ["my-posts", targetEmail],
    queryFn: () => base44.entities.Post.filter({ creator_email: targetEmail }, "-created_date", 50),
    enabled: !!targetEmail,
  });

  const { data: mySubscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ fan_email: user.email, status: "active" }),
    enabled: !!user,
  });

  const { data: profileSubscribers = [] } = useQuery({
    queryKey: ["profile-subscribers", targetEmail],
    queryFn: () => base44.entities.Subscription.filter({ creator_email: targetEmail, status: "active" }),
    enabled: !!targetEmail,
  });

  const { data: ppvTransactions = [] } = useQuery({
    queryKey: ["my-ppv", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ payer_email: user.email, type: "ppv", status: "completed" }),
    enabled: !!user,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["tiers", targetEmail],
    queryFn: () => base44.entities.SubscriptionTier.filter({ creator_email: targetEmail, is_active: true }),
    enabled: !!targetEmail,
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["all-posts", targetEmail],
    queryFn: () => base44.entities.Post.filter({ creator_email: targetEmail }),
    enabled: !!(targetEmail && isOtherUserProfile),
  });

  const { data: allCreatorProfiles = [] } = useQuery({
    queryKey: ["all-creators-map"],
    queryFn: () => base44.entities.CreatorProfile.filter({}),
    enabled: !!user,
  });

  const creatorsMap = allCreatorProfiles.reduce((acc, profile) => {
    acc[profile.user_email] = profile;
    return acc;
  }, {});

  // Determine if creator profile is public PPV only
  const targetProfile = isOtherUserProfile ? allCreatorProfiles.find(p => p.user_email === targetEmail) : null;
  const isPPVOnlyPublic = targetProfile && targetProfile.category && !tiers.length;
  const shouldRequirePayment = isOtherUserProfile && targetProfile && tiers.length > 0 && !isPPVOnlyPublic;

  const handleSubscribe = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    // Free subscription for users viewing regular profiles, or for PPV-only public profiles
    if (!shouldRequirePayment) {
      try {
        await base44.entities.Subscription.create({
          fan_email: user.email,
          creator_email: targetEmail,
          tier_id: "free",
          tier_level: 0,
          tier_name: "Gratuit",
          status: "active",
          auto_renew: true,
          start_date: new Date().toISOString().split('T')[0],
        });
        toast.success("Abonnement gratuit activé !");
        queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      } catch (error) {
        toast.error("Erreur lors de l'abonnement");
      }
    } else {
      // Paid subscription for creator profiles
      if (tiers.length > 0) {
        setSelectedTier(tiers[0]);
        setShowPaymentModal(true);
      }
    }
  };

  const handleUnsubscribe = async () => {
    if (!currentSub) return;
    try {
      await base44.entities.Subscription.delete(currentSub.id);
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      toast.success("Désabonnement effectué");
    } catch (error) {
      toast.error("Erreur lors de la désinscription");
    }
  };

  const ppvPostIds = ppvTransactions.map(tx => tx.reference_id).filter(Boolean);

  const { data: ppvPosts = [] } = useQuery({
    queryKey: ["my-ppv-posts", ppvPostIds],
    queryFn: async () => {
      if (ppvPostIds.length === 0) return [];
      const posts = await Promise.all(
        ppvPostIds.map(id => base44.entities.Post.filter({ id }).then(p => p[0]).catch(() => null))
      );
      return posts.filter(Boolean);
    },
    enabled: !!user && ppvPostIds.length > 0,
  });

  const { data: reposts = [] } = useQuery({
    queryKey: ["my-reposts", user?.email],
    queryFn: () => base44.entities.Repost.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const repostPostIds = reposts.map(r => r.post_id);

  const { data: repostedPosts = [] } = useQuery({
    queryKey: ["reposted-posts", repostPostIds],
    queryFn: async () => {
      if (repostPostIds.length === 0) return [];
      const posts = await Promise.all(
        repostPostIds.map(id => base44.entities.Post.filter({ id }).then(p => p[0]).catch(() => null))
      );
      return posts.filter(Boolean);
    },
    enabled: !!user && repostPostIds.length > 0,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["my-favorites", user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const favoritePostIds = favorites.map(fav => fav.post_id);

  const { data: favoritePosts = [] } = useQuery({
    queryKey: ["favorite-posts", favoritePostIds],
    queryFn: async () => {
      if (favoritePostIds.length === 0) return [];
      const posts = await Promise.all(
        favoritePostIds.map(id => base44.entities.Post.filter({ id }).then(p => p[0]).catch(() => null))
      );
      return posts.filter(Boolean);
    },
    enabled: !!user && favoritePostIds.length > 0,
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover */}
      <div className="relative h-36 md:h-48 bg-gradient-to-br from-violet-500 to-pink-500">
        {profile?.cover_photo_url && (
          <img src={profile.cover_photo_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute top-3 right-3">
          {!isOtherUserProfile && (
            <Link to={createPageUrl("Settings")}>
              <Button size="icon" variant="ghost" className="h-9 w-9 bg-black/20 hover:bg-black/30 text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="relative px-4 -mt-12 pb-4 border-b">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
              <AvatarImage src={profile?.profile_picture_url} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-2xl font-bold">
                {user.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            {!isOtherUserProfile && (
              <Link to={createPageUrl("CreateStory")} className="absolute -bottom-1 -right-1 bg-violet-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold hover:bg-violet-700 transition-colors">
                +
              </Link>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{profile?.display_name || user.full_name}</h1>
              {profile?.is_verified && <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500" />}
            </div>
            <p className="text-sm text-muted-foreground">@{profile?.username || user.email.split("@")[0]}</p>
          </div>
        </div>

        <div className="flex gap-6 mb-4 text-center text-sm">
          <div>
            <p className="font-semibold">{posts.length}</p>
            <p className="text-muted-foreground">Posts</p>
          </div>
          <div>
            <p className="font-semibold">{isOtherUserProfile ? profileSubscribers.length : profileSubscribers.length}</p>
            <p className="text-muted-foreground">Abonnés</p>
          </div>
          <div>
            <p className="font-semibold">{isOtherUserProfile ? userSubscriptions.length : mySubscriptions.length}</p>
            <p className="text-muted-foreground">Abonnements</p>
          </div>
        </div>

        {profile?.bio && (
          <p className="text-sm mb-4">{profile.bio}</p>
        )}

        <div className="flex gap-2 flex-wrap">
          {!isOtherUserProfile ? (
            <>
              <Link to={createPageUrl("CreatorDashboard")} className="flex-1">
                <Button variant="outline" className="w-full gap-1.5 h-9 text-sm rounded-xl">
                  <Wallet className="h-3.5 w-3.5" /> Portefeuille
                </Button>
              </Link>
              <Link to={createPageUrl("CreatePost")}>
                <Button className="gap-1.5 h-9 text-sm rounded-xl bg-gradient-to-r from-violet-600 to-pink-600">
                  <PlusSquare className="h-3.5 w-3.5" /> Post
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button 
                onClick={currentSub ? handleUnsubscribe : handleSubscribe}
                className={`flex-1 gap-1.5 h-9 text-sm rounded-xl ${
                  currentSub 
                    ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                    : "bg-gradient-to-r from-violet-600 to-pink-600"
                }`}
              >
                {currentSub ? "Se désabonner" : "S'abonner"}
              </Button>
              <Button variant="outline" className="gap-1.5 h-9 text-sm rounded-xl">
                <MessageCircle className="h-3.5 w-3.5" /> Message
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-4">
        <TabsList className="bg-gray-100 rounded-xl w-full p-1 mb-4 grid grid-cols-5">
          <TabsTrigger value="posts" className="rounded-lg text-[10px]">Posts</TabsTrigger>
          <TabsTrigger value="reposts" className="rounded-lg text-[10px]">Reposts</TabsTrigger>
          <TabsTrigger value="favorites" className="rounded-lg text-[10px]">Favoris</TabsTrigger>
          <TabsTrigger value="subscribers" className="rounded-lg text-[10px]">Abonnés</TabsTrigger>
          <TabsTrigger value="purchased" className="rounded-lg text-[10px]">Médias</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 pb-8">
          {posts.map(post => (
            <PostCard key={post.id} post={post} creator={profile} isLocked={false} currentUserEmail={user.email} onDelete={handleDeletePost} />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Image className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun post publié</p>
              <Link to={createPageUrl("CreatePost")}>
                <Button size="sm" className="mt-3 bg-gradient-to-r from-violet-600 to-pink-600">Créer votre premier post</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reposts" className="space-y-4 pb-8">
          {repostedPosts.map(post => {
            const creator = creatorsMap[post.creator_email];
            return (
              <div key={post.id} className="relative">
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mb-2 pl-2">
                  <Repeat2 className="h-3.5 w-3.5" />
                  <span>Vous avez republié</span>
                </div>
                <PostCard 
                  post={post} 
                  creator={creator} 
                  isLocked={false} 
                  currentUserEmail={user?.email}
                />
              </div>
            );
          })}
          {repostedPosts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Repeat2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucune republication</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4 pb-8">
          {favoritePosts.map(post => {
            const creator = creatorsMap[post.creator_email];
            return (
              <PostCard 
                key={post.id} 
                post={post} 
                creator={creator} 
                isLocked={false} 
                currentUserEmail={user.email}
              />
            );
          })}
          {favoritePosts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun favori</p>
              <Link to={createPageUrl("Explore")}>
                <Button size="sm" className="mt-3" variant="outline">Explorer du contenu</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-3 pb-8">
          {profileSubscribers.map(sub => {
            const subscriberInfo = creatorsMap[sub.fan_email] || { display_name: sub.fan_email.split("@")[0] };
            return (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-xl border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={subscriberInfo?.profile_picture_url} />
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-bold">
                      {subscriberInfo?.display_name?.[0] || sub.fan_email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{subscriberInfo?.display_name || sub.fan_email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{sub.tier_name}</Badge>
                      <span className="text-xs text-muted-foreground">{sub.amount_monthly ? sub.amount_monthly.toLocaleString() : "Gratuit"}</span>
                    </div>
                  </div>
                </div>
                <Badge className={sub.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}>
                  {sub.status === "active" ? "Actif" : "Inactif"}
                </Badge>
              </div>
            );
          })}
          {profileSubscribers.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun abonné</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchased" className="space-y-4 pb-8">
          {ppvPosts.map(post => {
            const creator = creatorsMap[post.creator_email];
            return (
              <PostCard 
                key={post.id} 
                post={post} 
                creator={creator} 
                isLocked={false} 
                currentUserEmail={user.email}
              />
            );
          })}
          {ppvPosts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun média acheté</p>
              <Link to={createPageUrl("Discover")}>
                <Button size="sm" className="mt-3" variant="outline">Explorer du contenu</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showPaymentModal && selectedTier && (
        <PaymentModal
          creator={profile}
          tier={selectedTier}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}