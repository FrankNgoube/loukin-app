import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CommentSection from "@/components/feed/CommentSection";

export default function PostDetail() {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("id");
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [creator, setCreator] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [postId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const postData = await base44.entities.Post.filter({ id: postId });
      if (postData[0]) {
        setPost(postData[0]);
        const profiles = await base44.entities.CreatorProfile.filter({ 
          user_email: postData[0].creator_email 
        });
        if (profiles[0]) setCreator(profiles[0]);
      }
    } catch {}
  };

  if (!post || !creator) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <Card className="overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator.profile_picture_url} />
              <AvatarFallback className="bg-violet-100 text-violet-700">
                {creator.display_name?.[0] || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{creator.display_name}</p>
              <p className="text-sm text-muted-foreground">@{creator.username}</p>
            </div>
          </div>
        </div>

        {post.media_urls?.[0] && (
          <img
            src={post.media_urls[0]}
            alt=""
            className="w-full aspect-square object-cover"
          />
        )}

        <div className="p-4">
          {post.caption && (
            <p className="text-sm mb-4">{post.caption}</p>
          )}
          
          <CommentSection post={post} currentUserEmail={currentUser?.email} />
        </div>
      </Card>
    </div>
  );
}