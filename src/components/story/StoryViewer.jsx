import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoryViewer({ story, onClose, onNext, onPrev }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          onNext?.();
          return 0;
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {Array(1).fill(0).map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            />
          </div>
        ))}
      </div>

      {/* Media */}
      <div className="relative w-full h-full max-w-md max-h-screen aspect-[9/16]">
        {story.media_url.includes(".mp4") || story.media_url.includes("video") ? (
          <video
            src={story.media_url}
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={story.media_url}
            alt="Story"
            className="w-full h-full object-cover"
          />
        )}

        {/* Caption overlay */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm">{story.caption}</p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>
    </motion.div>
  );
}