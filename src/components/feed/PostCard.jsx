import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Lock, DollarSign, MoreHorizontal, Eye, Trash2, Bookmark, Repeat2, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PaymentModal from "@/components/payment/PaymentModal";
import ShareModal from "@/components/feed/ShareModal";
import MediaCarousel from "@/components/feed/MediaCarousel";

export default function PostCard({ post, creator, isLocked, onLike, onComment, onUnlock, isLiked, currentUserEmail, onDelete }) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasReposted, setHasReposted] = useState(false);
  const [isLikedCurrent, setIsLikedCurrent] = useState(isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  React.useEffect(() => {
    if (currentUserEmail) {
      base44.entities.Favorite.filter({ user_email: currentUserEmail, post_id: post.id }).then(favs => {
        setIsFavorited(favs.length > 0);
      });
      base44.entities.Repost.filter({ user_email: currentUserEmail, post_id: post.id }).then(reposts => {
        setHasReposted(reposts.length > 0);
      });
      base44.entities.Like.filter({ user_email: currentUserEmail, post_id: post.id }).then(likes => {
        setIsLikedCurrent(likes.length > 0);
      });
    }
  }, [currentUserEmail, post.id]);

  const handleLike = async () => {
    if (!currentUserEmail) return;
    try {
      if (isLikedCurrent) {
        setIsLikedCurrent(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        const likes = await base44.entities.Like.filter({ user_email: currentUserEmail, post_id: post.id });
        if (likes[0]) {
          await base44.entities.Like.delete(likes[0].id);
          await base44.entities.Post.update(post.id, { likes_count: Math.max(0, (post.likes_count || 0) - 1) });
        }
      } else {
        setIsLikedCurrent(true);
        setLikesCount(prev => prev + 1);
        await base44.entities.Like.create({ user_email: currentUserEmail, post_id: post.id });
        await base44.entities.Post.update(post.id, { likes_count: (post.likes_count || 0) + 1 });

        if (post.creator_email !== currentUserEmail) {
          const user = await base44.auth.me();
          const userProfiles = await base44.entities.CreatorProfile.filter({ user_email: user.email });
          const userProfile = userProfiles[0];
          await base44.entities.Notification.create({
            user_email: post.creator_email,
            type: "new_like",
            title: "Nouveau like",
            message: `${userProfile?.display_name || user.full_name} a aimé votre publication`,
            from_user_email: currentUserEmail,
            from_user_name: userProfile?.display_name || user.full_name,
            link: `/PostDetail?id=${post.id}`
          });
        }
      }
    } catch {
      toast.error("Erreur lors du like");
      // Revert optimistic update
      setIsLikedCurrent(!isLikedCurrent);
      setLikesCount(isLikedCurrent ? likesCount + 1 : Math.max(0, likesCount - 1));
    }
  };

  const handleRepost = async () => {
    if (!currentUserEmail) return;
    if (post.visibility !== "public" || post.is_ppv) {
      toast.error("Seules les publications publiques peuvent être republiées");
      return;
    }
    try {
      if (hasReposted) {
        const reposts = await base44.entities.Repost.filter({ user_email: currentUserEmail, post_id: post.id });
        if (reposts[0]) {
          await base44.entities.Repost.delete(reposts[0].id);
          await base44.entities.Post.update(post.id, { reposts_count: Math.max(0, (post.reposts_count || 0) - 1) });
          setHasReposted(false);
          toast.success("Republication annulée");
        }
      } else {
        await base44.entities.Repost.create({
          user_email: currentUserEmail,
          post_id: post.id,
        });
        await base44.entities.Post.update(post.id, { reposts_count: (post.reposts_count || 0) + 1 });

        const user = await base44.auth.me();
        const userProfiles = await base44.entities.CreatorProfile.filter({ user_email: user.email });
        const userProfile = userProfiles[0];

        if (post.creator_email !== currentUserEmail) {
          await base44.entities.Notification.create({
            user_email: post.creator_email,
            type: "new_like",
            title: "Nouvelle republication",
            message: `${userProfile?.display_name || user.full_name} a republié votre publication`,
            from_user_email: currentUserEmail,
            from_user_name: userProfile?.display_name || user.full_name,
            link: `/PostDetail?id=${post.id}`
          });
        }

        setHasReposted(true);
        toast.success("Republié sur votre profil!");
      }
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const toggleFavorite = async () => {
    if (!currentUserEmail) return;
    setFavLoading(true);
    try {
      if (isFavorited) {
        const favs = await base44.entities.Favorite.filter({ user_email: currentUserEmail, post_id: post.id });
        if (favs[0]) await base44.entities.Favorite.delete(favs[0].id);
        setIsFavorited(false);
        toast.success("Retiré des favoris");
      } else {
        await base44.entities.Favorite.create({ user_email: currentUserEmail, post_id: post.id });

        const user = await base44.auth.me();
        const userProfiles = await base44.entities.CreatorProfile.filter({ user_email: user.email });
        const userProfile = userProfiles[0];

        if (post.creator_email !== currentUserEmail) {
          await base44.entities.Notification.create({
            user_email: post.creator_email,
            type: "new_like",
            title: "Mis en favoris",
            message: `${userProfile?.display_name || user.full_name} a ajouté votre publication en favoris`,
            from_user_email: currentUserEmail,
            from_user_name: userProfile?.display_name || user.full_name,
            link: `/PostDetail?id=${post.id}`
          });
        }

        setIsFavorited(true);
        toast.success("Ajouté aux favoris");
      }
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setFavLoading(false);
    }
  };

  const handleReport = async () => {
    if (!currentUserEmail) return;
    const reason = prompt("Raison du signalement (optionnel):");
    try {
      await base44.entities.PostReport.create({
        user_email: currentUserEmail,
        post_id: post.id,
        reason: reason || "Non spécifié"
      });
      toast.success("Publication signalée. Elle ne sera plus visible dans votre fil.");
      window.location.reload();
    } catch (error) {
      toast.error("Erreur lors du signalement");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 bg-transparent glass-panel interactive-card group">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link
            to={createPageUrl("CreatorProfile") + "?email=" + post.creator_email}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10 ring-2 ring-violet-500/20">
              <AvatarImage src={creator?.profile_picture_url} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-bold">
                {creator?.display_name?.[0] || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{creator?.display_name || "Créateur"}</p>
              <p className="text-xs text-muted-foreground">@{creator?.username}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {onDelete && currentUserEmail === post.creator_email && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(post.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {currentUserEmail && currentUserEmail !== post.creator_email && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                onClick={handleReport}
                title="Signaler cette publication"
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Media */}
        <div className="relative">
          {isLocked ? (
            <div className="aspect-square bg-gradient-to-br from-violet-100 to-pink-100 flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                <Lock className="h-7 w-7 text-violet-600" />
              </div>
              <p className="text-sm font-medium text-violet-900">Contenu exclusif</p>
              {post.is_ppv ? (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-pink-600 text-white"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Débloquer · {post.ppv_price.toLocaleString()} FCFA
                </Button>
              ) : (
                <Badge variant="outline" className="text-violet-700 border-violet-300">
                  Abonnement requis
                </Badge>
              )}
            </div>
          ) : (
            <>
              {post.media_urls?.[0] && (
                <MediaCarousel
                  mediaUrls={post.media_urls}
                  contentType={post.content_type}
                  username={creator?.username}
                />
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleLike} className="flex items-center gap-1.5 group">
                <Heart className={cn("h-5 w-5 transition-all group-hover:scale-110", isLikedCurrent ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500")} />
                <span className="text-sm font-medium">{likesCount}</span>
              </button>
              <button
                onClick={() => window.location.href = `/PostDetail?id=${post.id}`}
                className="flex items-center gap-1.5 group"
              >
                <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                <span className="text-sm font-medium">{post.comments_count || 0}</span>
              </button>
              <button
                onClick={handleRepost}
                className="flex items-center gap-1.5 group"
                disabled={post.visibility !== "public" || post.is_ppv}
              >
                <Repeat2 className={cn("h-5 w-5 transition-colors", hasReposted ? "text-green-500" : "text-muted-foreground group-hover:text-green-500", (post.visibility !== "public" || post.is_ppv) && "opacity-50")} />
                <span className="text-sm font-medium">{post.reposts_count || 0}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                className="group"
              >
                <Bookmark className={cn("h-5 w-5 transition-colors", isFavorited ? "fill-violet-600 text-violet-600" : "text-muted-foreground group-hover:text-violet-500")} />
              </button>
              <button onClick={() => setShowShareModal(true)} className="group">
                <Share2 className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
              </button>
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="text-sm">
              <span className="font-semibold mr-1">{creator?.username}</span>
              <span className={cn(!showFullCaption && post.caption.length > 120 && "line-clamp-2")}>
                {post.caption}
              </span>
              {post.caption.length > 120 && (
                <button
                  className="text-muted-foreground ml-1 hover:underline"
                  onClick={() => setShowFullCaption(!showFullCaption)}
                >
                  {showFullCaption ? "moins" : "plus"}
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.map((tag, i) => (
                <span key={i} className="text-xs text-violet-600 hover:underline cursor-pointer">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Payment Modal */}
      {post.is_ppv && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={post.ppv_price || 0}
          creatorEmail={post.creator_email}
          transactionType="ppv"
          contentId={post.id}
          onSuccess={() => {
            toast.success("Contenu débloqué !");
            window.location.reload();
          }}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        creator={creator}
      />
    </motion.div>
  );
}