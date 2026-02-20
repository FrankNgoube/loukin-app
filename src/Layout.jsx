import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home, Search, PlusSquare, MessageCircle, User, Settings, LayoutDashboard,
  Menu, X, LogOut, Shield, Heart, TrendingUp, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/layout/NotificationBell";
import AgeGate from "@/components/AgeGate";

const NAV_ITEMS = [
  { name: "Accueil", icon: Home, page: "Discover" },
  { name: "Explorer", icon: Search, page: "Explore" },
  { name: "Créer", icon: PlusSquare, page: "CreateStory" },
  { name: "Messages", icon: MessageCircle, page: "Messages" },
  { name: "Profil", icon: User, page: "MyProfile" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.CreatorProfile.filter({ user_email: me.email });
      if (profiles.length > 0) setCreatorProfile(profiles[0]);
      const notifs = await base44.entities.Notification.filter({ user_email: me.email, is_read: false }, '-created_date', 20);
      setNotifications(notifs);
    } catch { }
  };

  const handleMarkRead = async (notif) => {
    try {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch { }
  };

  const isCreator = !!creatorProfile;
  const isAdmin = user?.role === "admin";
  const noLayoutPages = ["Landing"];
  if (noLayoutPages.includes(currentPageName)) return <>{children}</>;

  return (
    <AgeGate>
      <div className="min-h-screen bg-gray-50/50">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-white/40 bg-white/70 backdrop-blur-md shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-40">
          {/* Logo */}
          <div className="p-5 border-b">
            <Link to={createPageUrl("Discover")} className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6996654e17490c87ca0c7e91/676d420ba_logo.png"
                alt="LouKin"
                className="h-9 w-9 rounded-xl object-cover"
              />
              <span className="text-xl font-black gradient-text">LouKin</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  currentPageName === item.page
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", currentPageName === item.page && "text-violet-600")} />
                {item.name}
              </Link>
            ))}

            {isCreator && (
              <Link
                to={createPageUrl("CreatorDashboard")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  currentPageName === "CreatorDashboard"
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <TrendingUp className="h-5 w-5" />
                Dashboard
              </Link>
            )}

            {isAdmin && (
              <Link
                to={createPageUrl("AdminDashboard")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  currentPageName === "AdminDashboard"
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}

            <Link
              to={createPageUrl("Settings")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                currentPageName === "Settings"
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Settings className="h-5 w-5" />
              Paramètres
            </Link>
          </nav>

          {/* User */}
          {user && (
            <div className="p-3 border-t">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={creatorProfile?.profile_picture_url} />
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-bold">
                      {user.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Link to={createPageUrl("CreateStory")} className="absolute -bottom-1 -right-1 bg-violet-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-violet-700 transition-colors">
                    +
                  </Link>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile top bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/70 backdrop-blur-md border-b border-white/40 z-40 flex items-center justify-between px-4">
          <Link to={createPageUrl("Discover")} className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6996654e17490c87ca0c7e91/676d420ba_logo.png"
              alt="LouKin"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-lg font-black gradient-text">LouKin</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell notifications={notifications} onMarkRead={handleMarkRead} />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 pt-14 bg-white">
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium",
                    currentPageName === item.page ? "bg-violet-50 text-violet-700" : "text-gray-600"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              {isCreator && (
                <Link to={createPageUrl("CreatorDashboard")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600">
                  <TrendingUp className="h-5 w-5" /> Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link to={createPageUrl("AdminDashboard")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600">
                  <Shield className="h-5 w-5" /> Admin
                </Link>
              )}
              <Link to={createPageUrl("Settings")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600">
                <Settings className="h-5 w-5" /> Paramètres
              </Link>
              <button onClick={() => base44.auth.logout()} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 w-full">
                <LogOut className="h-5 w-5" /> Déconnexion
              </button>
            </nav>
          </div>
        )}

        {/* Mobile bottom bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-md border-t border-white/40 z-40 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_24px_rgb(0,0,0,0.02)]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                currentPageName === item.page ? "text-violet-600" : "text-gray-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", item.page === "CreatePost" && "text-violet-600")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
          {children}
        </main>
      </div>
    </AgeGate>
  );
}