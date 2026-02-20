import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MediaCarousel({ mediaUrls, contentType, username }) {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  // Single media - no carousel needed
  if (mediaUrls.length === 1) {
    return (
      <div className="relative">
        {contentType === "video" ? (
          <video
            src={mediaUrls[0]}
            controls
            className="w-full aspect-square object-cover bg-black"
          />
        ) : (
          <img
            src={mediaUrls[0]}
            alt=""
            className="w-full aspect-square object-cover"
          />
        )}
        <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-white text-xs font-medium backdrop-blur-sm">
          Loukin.com/{username || 'user'}
        </div>
      </div>
    );
  }

  // Multiple media - show carousel
  return (
    <div className="relative">
      <Carousel className="w-full">
        <CarouselContent>
          {mediaUrls.map((url, idx) => (
            <CarouselItem key={idx}>
              <div className="relative">
                {contentType === "video" ? (
                  <video
                    src={url}
                    controls
                    className="w-full aspect-square object-cover bg-black"
                  />
                ) : (
                  <img
                    src={url}
                    alt={`Media ${idx + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                )}
                <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-white text-xs font-medium backdrop-blur-sm">
                  Loukin.com/{username || 'user'}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
      
      {/* Media counter */}
      <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded text-white text-xs font-medium backdrop-blur-sm">
        {mediaUrls.length} médias
      </div>
    </div>
  );
}