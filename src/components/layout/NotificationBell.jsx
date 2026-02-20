import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ notifications = [], onMarkRead }) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeIcons = {
    new_subscriber: "👤",
    new_tip: "💸",
    new_message: "💬",
    new_like: "❤️",
    new_comment: "💭",
    ppv_purchase: "🔓",
    payment_received: "💰",
    subscription_expired: "⏰"
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                    !notif.is_read && "bg-violet-50/50"
                  )}
                  onClick={() => {
                    onMarkRead?.(notif);
                    if (notif.link) {
                      navigate(notif.link);
                    } else if (notif.type === "new_message") {
                      navigate(createPageUrl("Messages"));
                    }
                  }}
                >
                  <div className="flex gap-2.5">
                    <span className="text-lg mt-0.5">{typeIcons[notif.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    </div>
                    {!notif.is_read && <div className="h-2 w-2 rounded-full bg-violet-500 mt-2 shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}