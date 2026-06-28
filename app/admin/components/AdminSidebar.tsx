"use client";

import {
  LayoutDashboard,
  Users,
  Link2,
  LogOut,
  X,
  UserCheck,
} from "lucide-react";
import { TabType } from "./types";
import { passwordlessUser } from "@/app/serverAction/getUser";

interface AdminSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  user: passwordlessUser;
  logout: () => Promise<void>;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  user,
  logout,
}: AdminSidebarProps) {
  const navItems: { tab: TabType; label: string; icon: React.ReactNode }[] = [
    {
      tab: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    { tab: "users", label: "List Users", icon: <Users size={18} /> },
    {
      tab: "influencers",
      label: "List Influencer",
      icon: <UserCheck size={18} />,
    },
  ];

  return (
    <aside
      className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-s1 border-r border-border flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:transform-none h-screen ${
        isMobileSidebarOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-outfit font-extrabold text-2xl tracking-wider text-t1">
              EVOLVE<span className="text-lime">.</span>
            </span>
            <span className="text-xs bg-lime/15 text-lime border border-lime/30 px-2 py-0.5 rounded font-mono font-bold">
              ADMIN
            </span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1 text-t3 hover:text-t1 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {navItems.map(({ tab, label, icon }) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === tab
                  ? "bg-purple text-t1 shadow-lg shadow-purple/10"
                  : "text-t2 hover:bg-s2 hover:text-t1"
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* User profile section */}
      <div className="flex flex-col gap-4 border-t border-border/80 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-s2 border border-border flex items-center justify-center font-bold text-sm text-lime uppercase">
            {user.name ? user.name[0] : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-t1 truncate">
              {user.name || "Administrator"}
            </p>
            <p className="text-[10px] text-t2 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-s2 hover:bg-s3 text-red/80 hover:text-red border border-border/60 hover:border-red/20 rounded-xl text-xs font-semibold transition-all duration-200"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
