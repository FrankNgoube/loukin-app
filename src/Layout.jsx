import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, ChefHat, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const NO_CHROME_PAGES = ["ClientMenu", "OrderConfirmation"];

function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center rounded-full border border-amber-300/70 bg-white/70 backdrop-blur p-0.5">
      {["fr", "en"].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-full transition-colors",
            lang === l
              ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow"
              : "text-stone-600 hover:text-stone-900"
          )}
          aria-label={l === "fr" ? "Français" : "English"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const { t } = useI18n();
  const location = useLocation();

  if (NO_CHROME_PAGES.includes(currentPageName)) {
    return <>{children}</>;
  }

  const nav = [
    { key: "Home", icon: Home, label: t("home") },
    { key: "KitchenDashboard", icon: ChefHat, label: t("kitchen") },
    { key: "AdminDashboard", icon: Settings, label: t("admin") },
  ];

  const isActive = (key) => {
    if (key === "Home") return location.pathname === "/" || location.pathname === "/Home";
    return location.pathname.startsWith(`/${key}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-gradient-to-r from-amber-50/95 via-orange-50/95 to-red-50/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl warm-gradient-bg flex items-center justify-center text-lg shadow-md">
              <span aria-hidden>🍲</span>
            </div>
            <div className="leading-tight">
              <div className="text-base font-black warm-gradient-text">{t("appName")}</div>
              <div className="text-[10px] text-stone-500 -mt-0.5 hidden sm:block">{t("tagline")}</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.key}
                to={createPageUrl(item.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors",
                  isActive(item.key)
                    ? "bg-white text-red-700 shadow-sm border border-amber-200"
                    : "text-stone-600 hover:text-red-700 hover:bg-white/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200 safe-pb">
        <div className="grid grid-cols-3">
          {nav.map((item) => (
            <Link
              key={item.key}
              to={createPageUrl(item.key)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-xs font-medium",
                isActive(item.key) ? "text-red-700" : "text-stone-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
