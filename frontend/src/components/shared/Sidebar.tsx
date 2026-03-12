import React from "react";
import { TABS, TabId } from "../../constants";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useActiveTrip, useTrips } from "../../hooks/useQueries";
import { Wallet, Plane, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onCreateTrip: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onCreateTrip,
}) => {
  const { clear } = useInternetIdentity();

  const { data: trips } = useTrips();
  const { data: activeTrip } = useActiveTrip();

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Header */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20">
            <Wallet className="w-[18px] h-[18px] text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-none">
              TripWallet
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Travel expenses
            </p>
          </div>
        </div>
      </div>

      {/* Active Trip */}
      {trips && trips.length > 0 && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-sidebar-accent rounded-lg">
            <Plane className="w-4 h-4 text-sidebar-accent-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {activeTrip?.name || "No Active Trip"}
              </p>
              {activeTrip && (
                <p className="text-xs text-muted-foreground truncate">
                  {activeTrip.primaryCurrency} · {activeTrip.budgetLimit}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        <div className="space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border flex items-center gap-1">
        <Button
          variant="ghost"
          onClick={() => clear()}
          className="flex-1 justify-start px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 group"
        >
          <LogOut className="w-[18px] h-[18px] transition-transform duration-150 group-hover:-translate-x-0.5" />
          <span>Sign Out</span>
        </Button>
        <ThemeToggle />
      </div>
    </aside>
  );
};
