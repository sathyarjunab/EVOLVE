"use client";

import { Link2 } from "lucide-react";

export default function AddLinkView() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn items-center justify-center text-center max-w-lg mx-auto py-16">
      <div className="w-16 h-16 bg-lime/10 border border-lime/30 rounded-2xl flex items-center justify-center text-lime mb-4">
        <Link2 size={32} />
      </div>
      <h1 className="text-2xl font-bold font-outfit text-t1">Create Referral Links</h1>
      <p className="text-sm text-t2 leading-relaxed">
        Generate tracked promotion links tied to active influencers. Track page-hit cookies and conversion metrics.
      </p>
      <div className="glass-panel py-3 px-6 bg-s1/65 text-xs text-purple border-purple/20 flex items-center gap-2 mt-4 font-semibold rounded-xl">
        <span>Features coming soon. Mapped to InfluencerLink model relationships.</span>
      </div>
    </div>
  );
}
