import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Users, Image, Shield, Search, CheckCircle, XCircle, TrendingUp, AlertTriangle, ExternalLink, Lock, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import StatCard from "@/components/ui/StatCard";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: creators = [] } = useQuery({
    queryKey: ["admin-creators"],
    queryFn: () => base44.entities.CreatorProfile.filter({}),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: () => base44.entities.Transaction.filter({}, "-created_date", 500),
  });

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: () => base44.entities.Subscription.filter({}),
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => base44.entities.Post.filter({}),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: creatorBalances = [] } = useQuery({
    queryKey: ["admin-creator-balances"],
    queryFn: () => base44.entities.CreatorBalance.filter({}),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ["admin-disbursements"],
    queryFn: () => base44.entities.Disbursement.filter({}, "-created_date", 200),
  });

  const { data: creatorApplications = [] } = useQuery({
    queryKey: ["creator-applications"],
    queryFn: () => base44.entities.CreatorApplication.filter({}, "-created_date", 100),
  });

  const { data: postReports = [] } = useQuery({
    queryKey: ["admin-post-reports"],
    queryFn: () => base44.entities.PostReport.filter({}, "-created_date", 200),
  });

  const { data: commentReports = [] } = useQuery({
    queryKey: ["admin-comment-reports"],
    queryFn: () => base44.entities.CommentReport.filter({}, "-created_date", 200),
  });

  // Stats
  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const platformFees = transactions.reduce((s, t) => s + (t.platform_fee || 0), 0);
  const activeCreators = creators.filter(c => c.status === "active").length;
  const activeSubs = allSubscriptions.filter(s => s.status === "active").length;

  // Monthly data
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mTx = transactions.filter(t => {
      const td = new Date(t.created_date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    monthlyData.push({
      month: d.toLocaleString("fr-FR", { month: "short" }),
      revenue: Math.round(mTx.reduce((s, t) => s + (t.amount || 0), 0) * 100) / 100,
      fees: Math.round(mTx.reduce((s, t) => s + (t.platform_fee || 0), 0) * 100) / 100,
    });
  }

  const handleVerify = async (creator) => {
    await base44.entities.CreatorProfile.update(creator.id, { is_verified: true });
    window.location.reload();
  };

  const handleSuspend = async (creator) => {
    await base44.entities.CreatorProfile.update(creator.id, { status: creator.status === "suspended" ? "active" : "suspended" });
    window.location.reload();
  };

  const handleSuspendUser = async (userObj) => {
    const reason = prompt("Raison de la suspension:");
    if (!reason) return;
    
    await base44.entities.User.update(userObj.id, {
      status: "suspended",
      suspension_reason: reason,
      suspended_at: new Date().toISOString(),
      suspended_by: user.email
    });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const handleDeleteUser = async (userObj) => {
    if (!confirm(`Êtes-vous sûr? Le compte ${userObj.email} sera supprimé définitivement.`)) return;
    
    await base44.entities.User.update(userObj.id, {
      status: "deleted",
      suspended_at: new Date().toISOString(),
      suspended_by: user.email
    });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const handleModeratePost = async (post) => {
    const newStatus = post.status === "removed" ? "published" : "removed";
    await base44.entities.Post.update(post.id, { status: newStatus });
    
    if (newStatus === "removed") {
      await base44.entities.Notification.create({
        user_email: post.creator_email,
        type: "new_message",
        title: "Publication modérée",
        message: "Votre publication a été supprimée par l'équipe de modération car elle ne respecte pas nos conditions d'utilisation.",
        is_read: false
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["creator-posts"] });
    window.location.reload();
  };

  const filteredCreators = creators.filter(c =>
    !search || c.display_name?.toLowerCase().includes(search.toLowerCase()) || c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleResolvePostReport = async (reportId, action) => {
    const report = postReports.find(r => r.id === reportId);
    if (!report) return;

    if (action === "remove") {
      await base44.entities.Post.update(report.post_id, { status: "removed" });
      await base44.entities.PostReport.update(reportId, { status: "reviewed" });
      
      const post = allPosts.find(p => p.id === report.post_id);
      if (post) {
        await base44.entities.Notification.create({
          user_email: post.creator_email,
          type: "new_message",
          title: "Publication supprimée",
          message: "Votre publication a été supprimée suite à un signalement.",
          is_read: false
        });
      }
      
      await base44.entities.Notification.create({
        user_email: report.user_email,
        type: "new_message",
        title: "Signalement approuvé",
        message: "Votre signalement a été examiné et la publication a été supprimée.",
        is_read: false
      });
    } else {
      await base44.entities.PostReport.update(reportId, { status: "rejected" });
      
      await base44.entities.Notification.create({
        user_email: report.user_email,
        type: "new_message",
        title: "Signalement rejeté",
        message: "Votre signalement a été examiné mais n'a pas été retenu.",
        is_read: false
      });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-post-reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const handleResolveCommentReport = async (reportId, action) => {
    const report = commentReports.find(r => r.id === reportId);
    if (!report) return;

    if (action === "remove") {
      const comment = await base44.entities.Comment.filter({ id: report.comment_id });
      await base44.entities.Comment.delete(report.comment_id);
      await base44.entities.CommentReport.update(reportId, { status: "reviewed" });
      
      if (comment[0]) {
        await base44.entities.Notification.create({
          user_email: comment[0].user_email,
          type: "new_message",
          title: "Commentaire supprimé",
          message: "Votre commentaire a été supprimé suite à un signalement.",
          is_read: false
        });
      }
      
      await base44.entities.Notification.create({
        user_email: report.user_email,
        type: "new_message",
        title: "Signalement approuvé",
        message: "Votre signalement a été examiné et le commentaire a été supprimé.",
        is_read: false
      });
    } else {
      await base44.entities.CommentReport.update(reportId, { status: "rejected" });
      
      await base44.entities.Notification.create({
        user_email: report.user_email,
        type: "new_message",
        title: "Signalement rejeté",
        message: "Votre signalement a été examiné mais n'a pas été retenu.",
        is_read: false
      });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-comment-reports"] });
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-3 text-red-400" />
          <p className="font-bold text-lg">Accès refusé</p>
          <p className="text-sm text-muted-foreground">Cette page est réservée aux administrateurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black"><span className="gradient-text">Administration</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de la plateforme LouKin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Volume total" value={`${totalRevenue.toFixed(0).toLocaleString()} FCFA`} icon={DollarSign} />
        <StatCard title="Commission plateforme" value={`${platformFees.toFixed(0).toLocaleString()} FCFA`} icon={TrendingUp} trendUp trend="20%" />
        <StatCard title="Créateurs actifs" value={activeCreators} icon={Users} />
        <StatCard title="Abonnements actifs" value={activeSubs} icon={Shield} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-gray-100 rounded-xl p-1 mb-5">
          <TabsTrigger value="overview" className="rounded-lg text-xs">Vue globale</TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg text-xs">
            Demandes créateurs
            {creatorApplications.filter(a => a.status === "pending").length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold">
                {creatorApplications.filter(a => a.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="creators" className="rounded-lg text-xs">Créateurs</TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg text-xs">Publications</TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-lg text-xs">Transactions</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg text-xs">
            Paiements créateurs
            {creatorBalances.filter(b => b.pending_balance > 0).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-violet-500 text-white rounded-full text-[9px] font-bold">
                {creatorBalances.filter(b => b.pending_balance > 0).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg text-xs">
            Signalements
            {(postReports.filter(r => r.status === "pending").length + commentReports.filter(r => r.status === "pending").length) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold">
                {postReports.filter(r => r.status === "pending").length + commentReports.filter(r => r.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg text-xs">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenus mensuels</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Total" />
                      <Bar dataKey="fees" fill="#EC4899" radius={[4, 4, 0, 0]} name="Commission" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Activité récente</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.slice(0, 8).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                      <div>
                        <span className="font-medium capitalize">{tx.type}</span>
                        <span className="text-xs text-muted-foreground ml-2">{tx.payer_email?.split("@")[0]}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(tx.amount || 0).toFixed(0).toLocaleString()} FCFA</p>
                        <p className="text-xs text-violet-600">Fee: {(tx.platform_fee || 0).toFixed(0).toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Demandes de devenir créateur ({creatorApplications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creatorApplications.map(app => (
                  <div key={app.id} className="p-4 rounded-xl bg-gray-50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{app.full_name}</p>
                        <p className="text-xs text-muted-foreground">{app.user_email}</p>
                      </div>
                      <Badge variant={
                        app.status === "pending" ? "secondary" :
                        app.status === "approved" ? "default" : "destructive"
                      }>
                        {app.status === "pending" ? "En attente" : app.status === "approved" ? "Approuvé" : "Refusé"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Âge:</span>
                        <span className="ml-1 font-medium">{app.age} ans</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Téléphone:</span>
                        <span className="ml-1 font-medium">{app.phone_number}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Adresse:</span>
                        <span className="ml-1 font-medium">{app.address_cameroon}</span>
                      </div>
                    </div>

                    <div>
                      <a 
                        href={app.id_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Voir le document d'identité
                      </a>
                    </div>

                    {app.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8"
                          onClick={async () => {
                            await base44.entities.CreatorApplication.update(app.id, {
                              status: "approved",
                              reviewed_by: user.email,
                              reviewed_date: new Date().toISOString()
                            });
                            
                            await base44.entities.CreatorProfile.create({
                              user_email: app.user_email,
                              display_name: app.full_name,
                              username: app.user_email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, ""),
                              bio: "",
                              category: "other",
                              status: "active"
                            });

                            await base44.entities.Notification.create({
                              user_email: app.user_email,
                              type: "new_message",
                              title: "Demande créateur approuvée",
                              message: "Félicitations ! Votre demande pour devenir créateur a été approuvée. Vous pouvez maintenant configurer votre profil.",
                              is_read: false,
                              link: createPageUrl("Settings")
                            });
                            
                            queryClient.invalidateQueries({ queryKey: ["creator-applications"] });
                            window.location.reload();
                          }}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="flex-1 h-8"
                          onClick={async () => {
                            const reason = prompt("Raison du refus:");
                            if (!reason) return;
                            
                            await base44.entities.CreatorApplication.update(app.id, {
                              status: "rejected",
                              rejection_reason: reason,
                              reviewed_by: user.email,
                              reviewed_date: new Date().toISOString()
                            });

                            await base44.entities.Notification.create({
                              user_email: app.user_email,
                              type: "new_message",
                              title: "Demande créateur refusée",
                              message: `Votre demande pour devenir créateur a été refusée. Raison: ${reason}`,
                              is_read: false,
                              link: createPageUrl("Settings")
                            });
                            
                            queryClient.invalidateQueries({ queryKey: ["creator-applications"] });
                            window.location.reload();
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Refuser
                        </Button>
                      </div>
                    )}

                    {app.status === "rejected" && app.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-800">
                        <strong>Raison du refus:</strong> {app.rejection_reason}
                      </div>
                    )}
                  </div>
                ))}
                {creatorApplications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Aucune demande de créateur</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Gestion des créateurs ({creators.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-9 h-8 text-xs rounded-lg" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCreators.map(creator => (
                  <div key={creator.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {creator.display_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm">{creator.display_name}</p>
                          {creator.is_verified && <CheckCircle className="h-3.5 w-3.5 text-violet-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">@{creator.username} · {creator.total_subscribers || 0} abonnés</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={createPageUrl("CreatorProfile") + `?id=${creator.id}`} target="_blank">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Badge className={creator.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {creator.status}
                      </Badge>
                      {!creator.is_verified && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleVerify(creator)}>
                          <CheckCircle className="h-3 w-3" /> Vérifier
                        </Button>
                      )}
                      <Button size="sm" variant={creator.status === "suspended" ? "default" : "destructive"} className="h-7 text-xs gap-1" onClick={() => handleSuspend(creator)}>
                        {creator.status === "suspended" ? "Réactiver" : "Suspendre"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Modération des publications ({allPosts.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {allPosts.map(post => {
                  const postCreator = creators.find(c => c.user_email === post.creator_email);
                  return (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {post.media_urls?.[0] && (
                          <img src={post.media_urls[0]} className="h-12 w-12 object-cover rounded-lg flex-shrink-0" alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{post.caption || "Sans légende"}</p>
                          <p className="text-xs text-muted-foreground">
                            Par: {postCreator?.display_name || post.creator_email?.split("@")[0]} · {post.content_type} · {new Date(post.created_date).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={post.status === "published" ? "default" : post.status === "removed" ? "destructive" : "secondary"}>
                          {post.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant={post.status === "removed" ? "outline" : "destructive"} 
                          className="h-7 text-xs" 
                          onClick={() => handleModeratePost(post)}
                        >
                          {post.status === "removed" ? "Rétablir" : "Supprimer"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold">Historique des transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left py-2 font-medium">Type</th>
                      <th className="text-left py-2 font-medium">Payeur</th>
                      <th className="text-left py-2 font-medium">Destinataire</th>
                      <th className="text-right py-2 font-medium">Montant</th>
                      <th className="text-right py-2 font-medium">Commission</th>
                      <th className="text-left py-2 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map(tx => (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 capitalize">{tx.type}</td>
                        <td className="py-2 text-muted-foreground">{tx.payer_email?.split("@")[0]}</td>
                        <td className="py-2 text-muted-foreground">{tx.recipient_email?.split("@")[0]}</td>
                        <td className="py-2 text-right font-medium">{(tx.amount || 0).toFixed(0).toLocaleString()} FCFA</td>
                        <td className="py-2 text-right text-violet-600">{(tx.platform_fee || 0).toFixed(0).toLocaleString()} FCFA</td>
                        <td className="py-2">
                          <Badge variant="secondary" className="text-[10px]">{tx.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-4">
            {/* Balances en attente */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Soldes en attente ({creatorBalances.filter(b => b.pending_balance > 0).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {creatorBalances
                    .filter(b => b.pending_balance > 0)
                    .sort((a, b) => b.pending_balance - a.pending_balance)
                    .map(balance => {
                      const creator = creators.find(c => c.user_email === balance.creator_email);
                      return (
                        <div key={balance.id} className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-sm">{creator?.display_name || balance.creator_email}</p>
                              <p className="text-xs text-muted-foreground">{balance.creator_email}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-700">{balance.pending_balance.toLocaleString()} FCFA</p>
                              <p className="text-xs text-muted-foreground">En attente</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div>
                              <span className="text-muted-foreground">Total vie:</span>
                              <span className="ml-1 font-medium">{balance.lifetime_earnings?.toLocaleString() || 0} FCFA</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Méthode:</span>
                              <span className="ml-1 font-medium">{balance.payment_method || "Non défini"}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Téléphone:</span>
                              <span className="ml-1 font-medium">{balance.payment_phone || "Non défini"}</span>
                            </div>
                          </div>

                          <Button 
                            size="sm" 
                            className="w-full h-8"
                            onClick={async () => {
                              if (!balance.payment_phone || !balance.payment_method) {
                                alert("Le créateur doit définir sa méthode de paiement et son numéro");
                                return;
                              }
                              const confirm = window.confirm(`Initier un paiement de ${balance.pending_balance.toLocaleString()} FCFA à ${creator?.display_name}?`);
                              if (!confirm) return;
                              
                              try {
                                const now = new Date();
                                const periodEnd = new Date(now);
                                const periodStart = new Date(now);
                                periodStart.setDate(1); // début du mois
                                
                                await base44.entities.Disbursement.create({
                                  creator_email: balance.creator_email,
                                  period_start: periodStart.toISOString().split('T')[0],
                                  period_end: periodEnd.toISOString().split('T')[0],
                                  total_earnings: balance.pending_balance,
                                  platform_fees_deducted: 0,
                                  net_amount: balance.pending_balance,
                                  payment_method: balance.payment_method,
                                  recipient_phone: balance.payment_phone,
                                  status: "pending",
                                  scheduled_for: new Date().toISOString().split('T')[0],
                                  admin_notes: "Paiement manuel initié par admin"
                                });
                                
                                await base44.entities.CreatorBalance.update(balance.id, {
                                  pending_balance: 0,
                                  available_balance: (balance.available_balance || 0) + balance.pending_balance,
                                  last_disbursement_at: new Date().toISOString()
                                });
                                
                                queryClient.invalidateQueries();
                                alert("Paiement initié avec succès!");
                              } catch (e) {
                                alert("Erreur: " + e.message);
                              }
                            }}
                          >
                            💳 Initier le paiement
                          </Button>
                        </div>
                      );
                    })}
                  {creatorBalances.filter(b => b.pending_balance > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun solde en attente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Historique des versements */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Historique des versements ({disbursements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {disbursements.slice(0, 20).map(disbursement => {
                    const creator = creators.find(c => c.user_email === disbursement.creator_email);
                    return (
                      <div key={disbursement.id} className="p-4 rounded-xl bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{creator?.display_name || disbursement.creator_email}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(disbursement.created_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{disbursement.net_amount.toLocaleString()} FCFA</p>
                            <Badge variant={
                              disbursement.status === "completed" ? "default" :
                              disbursement.status === "processing" ? "secondary" :
                              disbursement.status === "failed" ? "destructive" : "outline"
                            }>
                              {disbursement.status === "completed" ? "Complété" :
                               disbursement.status === "processing" ? "En cours" :
                               disbursement.status === "failed" ? "Échoué" : "En attente"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Période:</span>
                            <span className="ml-1 font-medium">
                              {new Date(disbursement.period_start).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - {new Date(disbursement.period_end).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Méthode:</span>
                            <span className="ml-1 font-medium">{disbursement.payment_method}</span>
                          </div>
                        </div>

                        {disbursement.status === "pending" && (
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 h-7 text-xs"
                              onClick={async () => {
                                if (!confirm("Marquer comme complété?")) return;
                                try {
                                  await base44.entities.Disbursement.update(disbursement.id, {
                                    status: "completed",
                                    completed_at: new Date().toISOString()
                                  });
                                  queryClient.invalidateQueries();
                                  alert("Statut mis à jour!");
                                } catch (e) {
                                  alert("Erreur: " + e.message);
                                }
                              }}
                            >
                              ✓ Marquer complété
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 h-7 text-xs"
                              onClick={async () => {
                                const reason = prompt("Raison de l'échec:");
                                if (!reason) return;
                                try {
                                  await base44.entities.Disbursement.update(disbursement.id, {
                                    status: "failed",
                                    admin_notes: reason
                                  });
                                  
                                  // Remettre le solde en pending
                                  const balance = creatorBalances.find(b => b.creator_email === disbursement.creator_email);
                                  if (balance) {
                                    await base44.entities.CreatorBalance.update(balance.id, {
                                      pending_balance: balance.pending_balance + disbursement.net_amount,
                                      available_balance: Math.max(0, balance.available_balance - disbursement.net_amount)
                                    });
                                  }
                                  
                                  queryClient.invalidateQueries();
                                  alert("Statut mis à jour!");
                                } catch (e) {
                                  alert("Erreur: " + e.message);
                                }
                              }}
                            >
                              ✗ Marquer échoué
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {disbursements.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun versement enregistré</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tous les créateurs */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Tous les créateurs ({creatorBalances.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {creatorBalances
                    .sort((a, b) => (b.lifetime_earnings || 0) - (a.lifetime_earnings || 0))
                    .map(balance => {
                      const creator = creators.find(c => c.user_email === balance.creator_email);
                      return (
                        <div key={balance.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{creator?.display_name || balance.creator_email}</p>
                              <p className="text-xs text-muted-foreground">{balance.creator_email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Lifetime</p>
                              <p className="font-bold text-sm">{(balance.lifetime_earnings || 0).toLocaleString()} FCFA</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 mt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">En attente:</span>
                              <span className="ml-1 font-bold text-orange-600">{balance.pending_balance?.toLocaleString() || 0} FCFA</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Versé:</span>
                              <span className="ml-1 font-medium">{(balance.available_balance || 0).toLocaleString()} FCFA</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {creatorBalances.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun créateur avec balance</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-4">
            {/* Signalements de publications */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Publications signalées ({postReports.filter(r => r.status === "pending").length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {postReports.filter(r => r.status === "pending").map(report => {
                    const post = allPosts.find(p => p.id === report.post_id);
                    const creator = creators.find(c => c.user_email === post?.creator_email);
                    return (
                      <div key={report.id} className="p-3 rounded-xl bg-red-50 border border-red-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">Publication de {creator?.display_name || post?.creator_email}</p>
                            <p className="text-xs text-muted-foreground">Signalée par {report.user_email}</p>
                            {report.reason && <p className="text-xs text-gray-600 mt-1">Raison: {report.reason}</p>}
                          </div>
                          <Badge variant="destructive" className="text-[10px]">En attente</Badge>
                        </div>
                        {post && (
                          <div className="mb-3 p-2 bg-white rounded-lg">
                            <p className="text-xs text-gray-700 line-clamp-2">{post.caption || "Sans légende"}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs"
                            onClick={() => handleResolvePostReport(report.id, "remove")}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Supprimer la publication
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleResolvePostReport(report.id, "reject")}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Rejeter le signalement
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {postReports.filter(r => r.status === "pending").length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun signalement en attente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Signalements de commentaires */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Commentaires signalés ({commentReports.filter(r => r.status === "pending").length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commentReports.filter(r => r.status === "pending").map(report => (
                    <div key={report.id} className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">Commentaire signalé</p>
                          <p className="text-xs text-muted-foreground">Signalé par {report.user_email}</p>
                          {report.reason && <p className="text-xs text-gray-600 mt-1">Raison: {report.reason}</p>}
                        </div>
                        <Badge variant="secondary" className="text-[10px]">En attente</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs"
                          onClick={() => handleResolveCommentReport(report.id, "remove")}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Supprimer le commentaire
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => handleResolveCommentReport(report.id, "reject")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Rejeter le signalement
                        </Button>
                      </div>
                    </div>
                  ))}
                  {commentReports.filter(r => r.status === "pending").length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun signalement en attente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold">Utilisateurs ({allUsers.filter(u => u.status !== "deleted").length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allUsers.filter(u => u.status !== "deleted").map(u => {
                  const userProfile = creators.find(c => c.user_email === u.email);
                  const isSuspended = u.status === "suspended";
                  return (
                    <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl ${isSuspended ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{u.full_name}</p>
                          {isSuspended && <Badge className="bg-red-600 text-white text-xs">Suspendu</Badge>}
                          {userProfile?.is_verified && <Badge className="bg-blue-600 text-white text-xs">Créateur vérifié</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {isSuspended && u.suspension_reason && <p className="text-xs text-red-600 mt-1">Raison: {u.suspension_reason}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {userProfile && (
                          <Link to={createPageUrl("CreatorProfile") + `?id=${userProfile.id}`} target="_blank">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        <Badge variant="outline" className="capitalize text-xs">{u.role}</Badge>
                        <Button 
                          size="sm" 
                          variant={isSuspended ? "default" : "outline"}
                          className={`h-7 text-xs gap-1 ${isSuspended ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                          onClick={() => handleSuspendUser(u)}
                        >
                          <Lock className="h-3 w-3" />
                          {isSuspended ? "Débloquer" : "Suspendre"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleDeleteUser(u)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}