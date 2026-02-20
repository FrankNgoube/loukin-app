import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <Card className={cn("relative overflow-hidden p-5 border-0 shadow-sm hover:shadow-md transition-all duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendUp ? "text-emerald-600" : "text-red-500")}>
              <span>{trendUp ? "↑" : "↓"}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-violet-600" />
          </div>
        )}
      </div>
    </Card>
  );
}