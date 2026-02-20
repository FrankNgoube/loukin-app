import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StoryRing({ creator, hasUnviewedStory, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 group transition-transform hover:scale-105 ${
        hasUnviewedStory ? "opacity-100" : "opacity-75"
      }`}
    >
      <div
        className={`relative ${
          hasUnviewedStory
            ? "ring-2 ring-violet-600 ring-offset-2"
            : "ring-2 ring-gray-300 ring-offset-2"
        } rounded-full transition-all`}
      >
        <Avatar className="h-16 w-16">
          <AvatarImage src={creator.profile_picture_url} alt={creator.display_name} />
          <AvatarFallback className="bg-gradient-to-br from-violet-400 to-pink-400 text-white font-bold">
            {creator.display_name[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      <p className="text-xs font-medium truncate max-w-[80px] text-center">{creator.display_name}</p>
    </button>
  );
}