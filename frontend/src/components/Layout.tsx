import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { TABS, TabId } from "../constants";
import { useActiveTrip, useTrips } from "../hooks/useQueries";
import { Wallet, Plane, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./shared/Sidebar";
import { ThemeToggle } from "./shared/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { QueryClient } from "@tanstack/react-query";

interface LayoutProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onCreateTrip: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  setActiveTab,
  onCreateTrip,
  children,
}) => {
  const queryClient = new QueryClient();
  const { clear } = useInternetIdentity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: trips } = useTrips();
  const { data: activeTrip } = useActiveTrip();

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    queryClient.clear();
    clear();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateTrip={onCreateTrip}
      />

      {/* Mobile Header */}
      <header className="md:hidden bg-card shadow-sm border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              TripWallet
            </h1>

            {trips && trips.length > 0 && (
              <div className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium border border-accent">
                <Plane className="w-4 h-4" />
                <span className="truncate max-w-[120px]">
                  {activeTrip?.name || "Select Trip"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-72 p-0 gap-0 flex flex-col bg-sidebar text-sidebar-foreground"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-4">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex-1 py-4 px-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "w-full px-3 py-2 text-left flex items-center gap-3 rounded-lg text-sm transition-colors duration-150 mb-0.5",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-3 py-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Sign Out</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="md:pl-72 min-h-screen">
        <div className="p-4 md:p-6">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
};
