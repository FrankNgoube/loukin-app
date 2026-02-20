import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Flag, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CommentSection({ post, currentUserEmail }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [likedComments, setLikedComments] = useState({});
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    loadComments();
    if (currentUserEmail) loadLikedComments();
  }, [post.id, currentUserEmail]);

  const loadComments = async () => {
    try {
      const allComments = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
      if (currentUserEmail) {
        const reportedComments = await base44.entities.CommentReport.filter({ user_email: currentUserEmail });
        const reportedIds = reportedComments.map(r => r.comment_id);
        setComments(allComments.filter(c => !reportedIds.includes(c.id)));
      } else {
        setComments(allComments);
      }
    } catch {}
  };

  const loadLikedComments = async () => {
    try {
      const likes = await base44.entities.CommentLike.filter({ user_email: currentUserEmail });
      const likedMap = {};
      likes.forEach(like => likedMap[like.comment_id] = true);
      setLikedComments(likedMap);
    } catch {}
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserEmail) return;
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.CreatorProfile.filter({ user_email: user.email });
      const profile = profiles[0];
      
      await base44.entities.Comment.create({
        user_email: currentUserEmail,
        post_id: post.id,
        content: newComment,
        user_display_name: profile?.display_name || user.full_name,
        user_avatar: profile?.profile_picture_url || ""
      });
      
      await base44.entities.Post.update(post.id, { 
        comments_count: (post.comments_count || 0) + 1 
      });
      
      if (post.creator_email !== currentUserEmail) {
        await base44.entities.Notification.create({
          user_email: post.creator_email,
          type: "new_comment",
          title: "Nouveau commentaire",
          message: `${profile?.display_name || user.full_name} a commenté votre publication`,
          from_user_email: currentUserEmail,
          from_user_name: profile?.display_name || user.full_name,
          link: `/PostDetail?id=${post.id}`
        });
      }
      
      
      const newCommentData = {
        id: "temp-" + Date.now(),
        user_email: currentUserEmail,
        post_id: post.id,
        content: newComment,
        user_display_name: profile?.display_name || user.full_name,
        user_avatar: profile?.profile_picture_url || "",
        created_date: new Date().toISOString(),
        likes_count: 0
      };
      
      setComments(prev => [newCommentData, ...prev]);
      setNewComment("");
      toast.success("Commentaire ajouté");
      
      // We can load in the background to get the real ID, but the UI is already updated
      loadComments();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId, currentLikesCount, comment) => {
    if (!currentUserEmail) return;
    try {
      if (likedComments[commentId]) {
        const likes = await base44.entities.CommentLike.filter({ 
          user_email: currentUserEmail, 
          comment_id: commentId 
        });
        const newLikesCount = Math.max(0, currentLikesCount - 1);
        setLikedComments(prev => ({ ...prev, [commentId]: false }));
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: newLikesCount } : c));
        
        if (likes[0]) {
          await base44.entities.CommentLike.delete(likes[0].id);
          await base44.entities.Comment.update(commentId, { 
            likes_count: newLikesCount 
          });
        }
        const newLikesCount = (currentLikesCount || 0) + 1;
        setLikedComments(prev => ({ ...prev, [commentId]: true }));
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: newLikesCount } : c));
        
        await base44.entities.CommentLike.create({ 
          user_email: currentUserEmail, 
          comment_id: commentId 
        });
        await base44.entities.Comment.update(commentId, { 
          likes_count: newLikesCount 
        });
        
        if (comment.user_email !== currentUserEmail) {
          const user = await base44.auth.me();
          const profiles = await base44.entities.CreatorProfile.filter({ user_email: user.email });
          const profile = profiles[0];
          
          await base44.entities.Notification.create({
            user_email: comment.user_email,
            type: "new_like",
            title: "Like sur votre commentaire",
            message: `${profile?.display_name || user.full_name} a aimé votre commentaire`,
            from_user_email: currentUserEmail,
            from_user_name: profile?.display_name || user.full_name,
            link: `/PostDetail?id=${post.id}`
          });
        }
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDeleteComment = async (comment) => {
    try {
      setComments(prev => prev.filter(c => c.id !== comment.id));
      toast.success("Commentaire supprimé");
      
      await base44.entities.Comment.delete(comment.id);
      await base44.entities.Post.update(post.id, { 
        comments_count: Math.max(0, (post.comments_count || 0) - 1) 
      });
    } catch {
      toast.error("Erreur");
    }
  };

  const handleReportComment = async () => {
    if (!reportReason.trim() || !reportingCommentId) return;
    try {
      await base44.entities.CommentReport.create({
        user_email: currentUserEmail,
        comment_id: reportingCommentId,
        reason: reportReason
      });
      toast.success("Commentaire signalé");
      setShowReportDialog(false);
      setReportingCommentId(null);
      setReportReason("");
    } catch {
      toast.error("Erreur");
    }
  };

  const canDeleteComment = (comment) => {
    return currentUserEmail === comment.user_email || currentUserEmail === post.creator_email;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user_avatar} />
              <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                {comment.user_display_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-2xl px-3 py-2">
                <p className="font-semibold text-sm">{comment.user_display_name}</p>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
              <div className="flex items-center gap-3 mt-1 px-2">
                <button 
                  onClick={() => handleLikeComment(comment.id, comment.likes_count, comment)}
                  className="flex items-center gap-1 group"
                >
                  <Heart className={cn("h-3.5 w-3.5 transition-colors", 
                    likedComments[comment.id] ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500"
                  )} />
                  {comment.likes_count > 0 && (
                    <span className="text-xs text-muted-foreground">{comment.likes_count}</span>
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canDeleteComment(comment) && (
                      <DropdownMenuItem onClick={() => handleDeleteComment(comment)} className="text-red-600">
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => {
                      setReportingCommentId(comment.id);
                      setShowReportDialog(true);
                    }}>
                      <Flag className="h-3.5 w-3.5 mr-2" />
                      Signaler
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentUserEmail && post.allow_comments && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <Button 
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            className="bg-gradient-to-r from-violet-600 to-pink-600"
          >
            Publier
          </Button>
        </div>
      )}

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler ce commentaire</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Raison du signalement..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleReportComment} disabled={!reportReason.trim()}>
              Signaler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}