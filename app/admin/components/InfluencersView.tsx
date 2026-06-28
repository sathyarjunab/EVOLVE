"use client";

import { Award } from "lucide-react";

export default function InfluencersView() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn items-center justify-center text-center max-w-lg mx-auto py-16">
      <div className="w-16 h-16 bg-purple/10 border border-purple/30 rounded-2xl flex items-center justify-center text-purple mb-4">
        <Award size={32} />
      </div>
      <h1 className="text-2xl font-bold font-outfit text-t1">Influencer Management</h1>
      <p className="text-sm text-t2 leading-relaxed">
        This module will allow admins to control influencer status, define share rates, and analyze referred registration logs.
      </p>
      <div className="glass-panel py-3 px-6 bg-s1/65 text-xs text-lime border-lime/20 flex items-center gap-2 mt-4 font-semibold rounded-xl">
        <span>Features coming soon. Influencer model mapped in Database schema.</span>
      </div>
    </div>
  );
}
