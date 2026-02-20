import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DollarSign, Users, Image, TrendingUp, Heart, Eye, MessageCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import StatCard from "@/components/ui/StatCard";

const COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["dash-profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.CreatorProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["dash-transactions", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ recipient_email: user.email }, "-created_date", 200),
    enabled: !!user,
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["dash-subs", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ creator_email: user.email, status: "active" }),
    enabled: !!user,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["dash-posts", user?.email],
    queryFn: () => base44.entities.Post.filter({ creator_email: user.email, status: "published" }, "-created_date", 100),
    enabled: !!user,
  });

  // Calculate stats
  const totalEarnings = transactions.reduce((sum, t) => sum + (t.net_amount || 0), 0);
  const monthlyEarnings = transactions.filter(t => {
    const d = new Date(t.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, t) => sum + (t.net_amount || 0), 0);

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  // Revenue by type
  const revenueByType = {};
  transactions.forEach(t => {
    revenueByType[t.type] = (revenueByType[t.type] || 0) + (t.net_amount || 0);
  });
  const pieData = Object.entries(revenueByType).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  // Tier distribution
  const tierDist = {};
  subscribers.forEach(s => {
    const name = s.tier_name || "Standard";
    tierDist[name] = (tierDist[name] || 0) + 1;
  });
  const tierData = Object.entries(tierDist).map(([name, count]) => ({ name, count }));

  // Monthly revenue (simple simulation)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthTx = transactions.filter(t => {
      const td = new Date(t.created_date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    monthlyData.push({
      month: d.toLocaleString("fr-FR", { month: "short" }),
      revenue: Math.round(monthTx.reduce((s, t) => s + (t.net_amount || 0), 0) * 100) / 100,
    });
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black"><span className="gradient-text">Dashboard Créateur</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de vos performances</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Revenus du mois" value={`${monthlyEarnings.toFixed(0).toLocaleString()} FCFA`} icon={DollarSign} trendUp trend="+12%" />
        <StatCard title="Abonnés actifs" value={subscribers.length} icon={Users} trendUp trend="+8" />
        <StatCard title="Total posts" value={posts.length} icon={Image} />
        <StatCard title="Likes totaux" value={totalLikes} icon={Heart} />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="bg-gray-100 rounded-xl p-1">
          <TabsTrigger value="revenue" className="rounded-lg text-xs">Revenus</TabsTrigger>
          <TabsTrigger value="subscribers" className="rounded-lg text-xs">Abonnés</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg text-xs">Contenu</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly revenue chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Revenus mensuels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by type */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Revenus par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value.toLocaleString()} FCFA`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent transactions */}
          <Card className="border-0 shadow-sm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Dernières transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 10).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{tx.payer_email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+{(tx.net_amount || 0).toFixed(0).toLocaleString()} FCFA</span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Aucune transaction</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Répartition par tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tierData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Abonnés récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscribers.slice(0, 8).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{sub.fan_email}</p>
                        <p className="text-xs text-muted-foreground">{sub.tier_name} · {sub.amount_monthly.toLocaleString()} FCFA/mois</p>
                      </div>
                    </div>
                  ))}
                  {subscribers.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Aucun abonné</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Vos posts récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {posts.slice(0, 10).map(post => (
                  <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {post.media_urls?.[0] ? (
                        <img src={post.media_urls[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Image className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{post.caption || "Sans légende"}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{post.visibility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}