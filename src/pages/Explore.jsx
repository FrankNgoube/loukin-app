import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Flame, Star, Award } from "lucide-react";
import CreatorCard from "@/components/feed/CreatorCard";

const TRENDING_TAGS = ["fitness", "cuisine", "art", "gaming", "musique", "voyage", "mode", "éducation", "comédie", "photo"];

export default function Explore() {
  const [search, setSearch] = useState("");

  const { data: creators = [] } = useQuery({
    queryKey: ["explore-creators"],
    queryFn: () => base44.entities.CreatorProfile.filter({ status: "active" }, "-total_subscribers", 50),
  });

  const filtered = creators.filter(c =>
    !search || c.display_name?.toLowerCase().includes(search.toLowerCase()) || c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const topCreators = [...creators].sort((a, b) => (b.total_subscribers || 0) - (a.total_subscribers || 0)).slice(0, 6);
  const newCreators = [...creators].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1"><span className="gradient-text">Explorer</span></h1>
        <p className="text-sm text-muted-foreground">Trouvez vos prochains créateurs favoris</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." className="pl-10 h-11 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {!search && (
        <>
          {/* Trending tags */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-4 w-4 text-orange-500" />
              <h2 className="font-bold text-sm">Tags tendance</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map(tag => (
                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-violet-50 hover:border-violet-300 px-3 py-1 rounded-full text-xs" onClick={() => setSearch(tag)}>
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Top Creators */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-violet-500" />
              <h2 className="font-bold text-sm">Top créateurs</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topCreators.map(c => <CreatorCard key={c.id} creator={c} />)}
            </div>
          </div>

          {/* Rising Stars */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-amber-500" />
              <h2 className="font-bold text-sm">Nouveaux créateurs</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {newCreators.map(c => <CreatorCard key={c.id} creator={c} />)}
            </div>
          </div>
        </>
      )}

      {search && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(c => <CreatorCard key={c.id} creator={c} />)}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun résultat pour "{search}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}