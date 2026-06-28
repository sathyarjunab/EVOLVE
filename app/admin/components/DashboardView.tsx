"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Wallet, Users, Award, Coins, Loader2 } from "lucide-react";

interface DashboardData {
  totalUsers: number;
  newUsersThisWeek: number;
  influencersCount: number;
  newInfluencersThisMonth: number;
  totalInfluencerPayouts: number;
  estRevenue: number;
  newTransactionsThisMonth: number;
  productSplit: {
    habitTrackerPct: number;
    moneyTrackerPct: number;
  };
  registrations: {
    name: string;
    count: number;
  }[];
}

export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard statistics");
        }
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.error || "Failed to load dashboard data");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-t2">
        <Loader2 className="animate-spin text-purple mb-3" size={32} />
        <p className="text-sm font-medium">Loading operational metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-6 border-red/20 text-center max-w-md mx-auto my-10">
        <p className="text-red font-semibold mb-2">Error loading dashboard</p>
        <p className="text-xs text-t2">{error || "Failed to retrieve statistics."}</p>
      </div>
    );
  }

  // Calculate coordinates for the line chart
  const maxCount = Math.max(...data.registrations.map((r) => r.count), 1);
  const points = data.registrations.map((r, i) => ({
    x: 20 + i * 120,
    y: 180 - (r.count / maxCount) * 140,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} 220 L ${points[0].x} 220 Z`
    : "";

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-t1">
          Admin Dashboard
        </h1>
        <p className="text-sm text-t2 mt-1">
          Real-time operational overview and metrics snapshot.
        </p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Users */}
        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1">
              {data.totalUsers}
            </p>
            <div className="flex items-center gap-1 text-xs text-grn mt-1.5 font-medium">
              <TrendingUp size={12} />
              <span>+{data.newUsersThisWeek} new this week</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-purple/10 border border-purple/30 rounded-xl flex items-center justify-center text-purple">
            <Users size={22} />
          </div>
        </div>

        {/* Card 2: Influencers */}
        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Influencers</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1">
              {data.influencersCount}
            </p>
            <div className="flex items-center gap-1 text-xs text-grn mt-1.5 font-medium">
              <TrendingUp size={12} />
              <span>+{data.newInfluencersThisMonth} new this month</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-lime/10 border border-lime/30 rounded-xl flex items-center justify-center text-lime">
            <Award size={22} />
          </div>
        </div>

        {/* Card 3: Influencer Payouts */}
        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Influencer Payouts</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1 font-mono">
              ${data.totalInfluencerPayouts.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 text-xs text-t3 mt-1.5 font-medium">
              <span>Total influencer mapping rewards</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-purple/10 border border-purple/30 rounded-xl flex items-center justify-center text-purple">
            <Coins size={22} />
          </div>
        </div>

        {/* Card 4: Est. Revenue */}
        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Est. Revenue</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1 font-mono">
              ${data.estRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 text-xs text-grn mt-1.5 font-medium">
              <TrendingUp size={12} />
              <span>+{data.newTransactionsThisMonth} orders this month</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-lime/10 border border-lime/30 rounded-xl flex items-center justify-center text-lime">
            <Wallet size={22} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Registration Performance Chart */}
        <div className="glass-panel lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-outfit text-t1">User Registration Performance</h3>
            <span className="text-[10px] bg-s2 border border-border px-2 py-1 rounded text-t2 font-medium">Monthly view</span>
          </div>
          <div className="h-56 w-full flex items-end justify-between pt-4 pb-2 border-b border-border/40 relative">
            {/* Grid Y Axis Labels */}
            <div className="absolute inset-0 pt-4 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">{maxCount}</div>
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">{Math.round(maxCount * 2 / 3)}</div>
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">{Math.round(maxCount * 1 / 3)}</div>
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">0</div>
            </div>
            {/* SVG line and gradient fill */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
              {linePath && <path d={linePath} fill="none" stroke="#7B6EF5" strokeWidth="3.5" strokeLinecap="round" />}
              {areaPath && <path d={areaPath} fill="url(#gradient-purple)" opacity="0.08" />}
              <defs>
                <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B6EF5" />
                  <stop offset="100%" stopColor="#7B6EF5" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            {/* X Axis Labels */}
            {data.registrations.map((r, i) => (
              <span key={i} className="text-[9px] text-t2 z-10">{r.name}</span>
            ))}
          </div>
        </div>

        {/* Product Activity split */}
        <div className="glass-panel flex flex-col justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold font-outfit text-t1">Product Activity</h3>
            <p className="text-xs text-t2">Active users usage split</p>
          </div>
          <div className="flex flex-col gap-4 my-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Habit Tracker</span>
                <span className="text-lime">{data.productSplit.habitTrackerPct}%</span>
              </div>
              <div className="w-full bg-s2 rounded-full h-2">
                <div className="bg-lime h-2 rounded-full transition-all duration-500" style={{ width: `${data.productSplit.habitTrackerPct}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Money Tracker</span>
                <span className="text-purple">{data.productSplit.moneyTrackerPct}%</span>
              </div>
              <div className="w-full bg-s2 rounded-full h-2">
                <div className="bg-purple h-2 rounded-full transition-all duration-500" style={{ width: `${data.productSplit.moneyTrackerPct}%` }}></div>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-t3 leading-relaxed border-t border-border/55 pt-3">
            * Dynamic statistics are compiled live from system activity.
          </div>
        </div>
      </div>
    </div>
  );
}
