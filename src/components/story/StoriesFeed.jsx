import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StoryRing from "./StoryRing";
import StoryViewer from "./StoryViewer";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StoriesFeed() {
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(null);
  const [viewedStories, setViewedStories] = useState(new Set());
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch all active stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const now = new Date();
      const allStories = await base44.entities.Story.list("-created_date", 100);
      return allStories.filter((s) => new Date(s.expires_at) > now && !s.is_archived);
    },
  });

  // Fetch creators with stories
  const { data: creatorProfiles = [] } = useQuery({
    queryKey: ["creators-with-stories", stories.length],
    queryFn: async () => {
      const creatorEmails = [...new Set(stories.map((s) => s.creator_email))];
      if (creatorEmails.length === 0) return [];

      const profiles = await Promise.all(
        creatorEmails.map(async (email) => {
          const result = await base44.entities.CreatorProfile.filter({ user_email: email });
          return result[0];
        })
      );
      return profiles.filter(Boolean);
    },
  });

  // Track story views
  const handleStoryView = async (story) => {
    if (user && !viewedStories.has(story.id)) {
      setViewedStories((prev) => new Set([...prev, story.id]));

      const updatedViewed = [
        ...(story.viewed_by || []),
        user.email,
      ];

      await base44.entities.Story.update(story.id, {
        viewed_by: updatedViewed,
        views_count: updatedViewed.length,
      });
    }
  };

  const currentStory = stories[currentStoryIndex];

  const handleNextStory = () => {
    if (currentStoryIndex !== null && currentStoryIndex < stories.length - 1) {
      handleStoryView(stories[currentStoryIndex]);
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      setCurrentStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex !== null && currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleOpenStory = (creatorEmail, index) => {
    const creatorStories = stories.filter((s) => s.creator_email === creatorEmail);
    setCurrentStoryIndex(stories.indexOf(creatorStories[index]));
  };

  if (isLoading) return <div className="text-center py-4">Chargement...</div>;

  return (
    <div className="space-y-4">
      {/* Stories Feed */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 px-4 min-w-min">
          {/* Create story button */}
          <button
            onClick={() => navigate(createPageUrl("CreateStory"))}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="relative h-16 w-16 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform ring-2 ring-gray-300 ring-offset-2">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-medium text-center">Votre\nstory</p>
          </button>

          {/* Creator stories */}
          {creatorProfiles.map((creator) => {
            const creatorStories = stories.filter(
              (s) => s.creator_email === creator.user_email
            );
            const hasUnviewed = creatorStories.some(
              (s) => user && !s.viewed_by?.includes(user.email)
            );

            return (
              <StoryRing
                key={creator.id}
                creator={creator}
                hasUnviewedStory={hasUnviewed}
                onClick={() => handleOpenStory(creator.user_email, 0)}
              />
            );
          })}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {currentStory && (
        <StoryViewer
          story={currentStory}
          onClose={() => {
            handleStoryView(currentStory);
            setCurrentStoryIndex(null);
          }}
          onNext={handleNextStory}
          onPrev={currentStoryIndex > 0 ? handlePrevStory : null}
        />
      )}
    </div>
  );
}