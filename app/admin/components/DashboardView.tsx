"use client";

import { TrendingUp, Wallet, Activity, Users, Award } from "lucide-react";

export default function DashboardView() {
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
        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1">124</p>
            <div className="flex items-center gap-1 text-xs text-grn mt-1.5">
              <TrendingUp size={12} />
              <span>+12.3% this week</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-purple/10 border border-purple/30 rounded-xl flex items-center justify-center text-purple">
            <Users size={22} />
          </div>
        </div>

        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Influencers</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1">8</p>
            <div className="flex items-center gap-1 text-xs text-grn mt-1.5">
              <TrendingUp size={12} />
              <span>+2 new creators</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-lime/10 border border-lime/30 rounded-xl flex items-center justify-center text-lime">
            <Award size={22} />
          </div>
        </div>

        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Completion Pct</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1">74.2%</p>
            <div className="flex items-center gap-1 text-xs text-grn mt-1.5">
              <TrendingUp size={12} />
              <span>+4.8% streak average</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-purple/10 border border-purple/30 rounded-xl flex items-center justify-center text-purple">
            <Activity size={22} />
          </div>
        </div>

        <div className="glass-panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-bold text-t2 uppercase tracking-wider">Est. Revenue</p>
            <p className="text-3xl font-extrabold font-outfit mt-2 text-t1">$4,850</p>
            <div className="flex items-center gap-1 text-xs text-grn mt-1.5">
              <TrendingUp size={12} />
              <span>+15.2% vs last month</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-lime/10 border border-lime/30 rounded-xl flex items-center justify-center text-lime">
            <Wallet size={22} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-outfit text-t1">User Registration Performance</h3>
            <span className="text-[10px] bg-s2 border border-border px-2 py-1 rounded text-t2 font-medium">Monthly view</span>
          </div>
          <div className="h-56 w-full flex items-end justify-between pt-4 pb-2 border-b border-border/40 relative">
            <div className="absolute inset-0 pt-4 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">150</div>
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">100</div>
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">50</div>
              <div className="w-full border-t border-border/10 text-[9px] text-t3 text-right pr-2">0</div>
            </div>
            <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
              <path d="M 20 180 Q 120 140 220 110 T 420 50 T 620 30" fill="none" stroke="#7B6EF5" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 20 180 Q 120 140 220 110 T 420 50 T 620 30 L 620 220 L 20 220 Z" fill="url(#gradient-purple)" opacity="0.08" />
              <defs>
                <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B6EF5" />
                  <stop offset="100%" stopColor="#7B6EF5" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[9px] text-t2">Jan</span>
            <span className="text-[9px] text-t2">Feb</span>
            <span className="text-[9px] text-t2">Mar</span>
            <span className="text-[9px] text-t2">Apr</span>
            <span className="text-[9px] text-t2">May</span>
            <span className="text-[9px] text-t2">Jun</span>
          </div>
        </div>

        <div className="glass-panel flex flex-col justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold font-outfit text-t1">Product Activity</h3>
            <p className="text-xs text-t2">Active users usage split</p>
          </div>
          <div className="flex flex-col gap-4 my-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Habit Tracker</span>
                <span className="text-lime">78%</span>
              </div>
              <div className="w-full bg-s2 rounded-full h-2">
                <div className="bg-lime h-2 rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Money Tracker</span>
                <span className="text-purple">42%</span>
              </div>
              <div className="w-full bg-s2 rounded-full h-2">
                <div className="bg-purple h-2 rounded-full" style={{ width: "42%" }}></div>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-t3 leading-relaxed border-t border-border/55 pt-3">
            * Dynamic statistics are currently compiled on cached 12-hour windows.
          </div>
        </div>
      </div>
    </div>
  );
}
