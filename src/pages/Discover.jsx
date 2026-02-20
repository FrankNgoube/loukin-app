import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Sparkles, Users, DollarSign } from "lucide-react";
import PostCard from "@/components/feed/PostCard.jsx";
import CreatorCard from "@/components/feed/CreatorCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = ["Tous", "fitness", "art", "music", "cooking", "gaming", "fashion", "photography", "education", "lifestyle"];

export default function Discover() {
  const [activeTab, setActiveTab] = useState("feed");
  const [category, setCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "public", user?.email],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.filter({ status: "published" }, "-created_date", 30);
      
      // Filter out reported posts
      let filteredPosts = allPosts;
      if (user) {
        const reportedPosts = await base44.entities.PostReport.filter({ user_email: user.email });
        const reportedIds = reportedPosts.map(r => r.post_id);
        filteredPosts = allPosts.filter(p => !reportedIds.includes(p.id));
      }
      
      // Filter by visibility - only show public posts or posts from user's subscribed creators
      const visiblePosts = [];
      for (const post of filteredPosts) {
        if (post.visibility === "public") {
          visiblePosts.push(post);
        } else if (user) {
          // Check if user is subscribed to this creator
          const subscriptions = await base44.entities.Subscription.filter({ 
            fan_email: user.email, 
            creator_email: post.creator_email,
            status: "active"
          });
          if (subscriptions.length > 0 || post.creator_email === user.email) {
            visiblePosts.push(post);
          }
        }
      }
      
      return visiblePosts;
    },
  });

  const { data: creators = [] } = useQuery({
    queryKey: ["creators"],
    queryFn: () => base44.entities.CreatorProfile.filter({ status: "active" }, "-total_subscribers", 50),
  });

  const filteredCreators = creators.filter(c => {
    if (category !== "Tous" && c.category !== category) return false;
    if (searchQuery && !c.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.username?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Auto-switch to creators tab when searching
  useEffect(() => {
    if (searchQuery && activeTab !== "creators") {
      setActiveTab("creators");
    }
  }, [searchQuery]);

  const creatorsMap = {};
  creators.forEach(c => { creatorsMap[c.user_email] = c; });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1">
            <span className="gradient-text">Découvrir</span>
          </h1>
          <p className="text-sm text-muted-foreground">Explorez les créateurs et contenus tendance</p>
        </div>
        <Link to={createPageUrl("Settings")}>
          <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 gap-1.5 h-9 text-xs whitespace-nowrap">
            <DollarSign className="h-3.5 w-3.5" />
            Devenir créateur
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher créateurs, contenus..."
          className="pl-10 h-11 rounded-xl border-gray-200 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
        <TabsList className="bg-gray-100 p-1 rounded-xl w-full">
          <TabsTrigger value="feed" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Pour toi
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Tendance
          </TabsTrigger>
          <TabsTrigger value="creators" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" /> Créateurs
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={category === cat ? "default" : "outline"}
            className={`cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              category === cat
                ? "bg-violet-600 text-white hover:bg-violet-700 border-violet-600"
                : "hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300"
            }`}
            onClick={() => setCategory(cat)}
          >
            {cat === "Tous" ? "Tous" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Badge>
        ))}
      </div>

      {/* Content */}
      {activeTab === "creators" ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredCreators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
          {filteredCreators.length === 0 && (
            <div className="col-span-2 text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun créateur trouvé</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              creator={creatorsMap[post.creator_email]}
              isLocked={post.visibility !== "public" && (!user || post.creator_email !== user.email)}
              currentUserEmail={user?.email}
              onLike={async (p) => {
                if (!user) return;
                const likes = await base44.entities.Like.filter({ user_email: user.email, post_id: p.id });
                if (likes.length > 0) {
                  await base44.entities.Like.delete(likes[0].id);
                  await base44.entities.Post.update(p.id, { likes_count: Math.max(0, (p.likes_count || 0) - 1) });
                } else {
                  await base44.entities.Like.create({ user_email: user.email, post_id: p.id });
                  await base44.entities.Post.update(p.id, { likes_count: (p.likes_count || 0) + 1 });
                  
                  if (p.creator_email !== user.email) {
                    const userProfiles = await base44.entities.CreatorProfile.filter({ user_email: user.email });
                    const userProfile = userProfiles[0];
                    await base44.entities.Notification.create({
                      user_email: p.creator_email,
                      type: "new_like",
                      title: "Nouveau like",
                      message: `${userProfile?.display_name || user.full_name} a aimé votre publication`,
                      from_user_email: user.email,
                      from_user_name: userProfile?.display_name || user.full_name,
                      link: `/PostDetail?id=${p.id}`
                    });
                  }
                }
                window.location.reload();
              }}
            />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun contenu pour le moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}