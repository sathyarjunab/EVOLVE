"use client";

import { useState } from "react";
import { X, Users, Award, Shield, Loader2 } from "lucide-react";
import { UserRecord } from "./types";

interface EditUserModalProps {
  editingUser: UserRecord;
  onClose: () => void;
  onSaved: (updatedUser: UserRecord) => void;
}

export default function EditUserModal({ editingUser, onClose, onSaved }: EditUserModalProps) {
  const standardPlatforms = ["YouTube", "Instagram", "Twitter / X", "TikTok", "Twitch"];

  const [editUserType, setEditUserType] = useState<"ADMIN" | "USER" | "INFLUENCER">(editingUser.userType);
  const [editInfluencerType, setEditInfluencerType] = useState(editingUser.influencerType || "");
  const [editInfluencerShare, setEditInfluencerShare] = useState(Number(editingUser.influencerShare) || 0);
  const [customPlatformActive, setCustomPlatformActive] = useState(
    editingUser.userType === "INFLUENCER" &&
    !!editingUser.influencerType &&
    !standardPlatforms.includes(editingUser.influencerType)
  );
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingUser, setSavingUser] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (editUserType === "INFLUENCER") {
      if (!editInfluencerType || editInfluencerType.trim() === "") {
        errors.influencerType = "Influencer platform type is required.";
      }
      if (editInfluencerShare <= 0 || editInfluencerShare > 100) {
        errors.influencerShare = "Share percentage must be between 0.01% and 100%.";
      }
    }
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setSavingUser(true);
    setEditErrors({});
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          userType: editUserType,
          influencerType: editUserType === "INFLUENCER" ? editInfluencerType : "",
          influencerShare: editUserType === "INFLUENCER" ? editInfluencerShare : 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        onSaved(json.data);
      } else {
        if (json.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, val] of Object.entries(json.details)) {
            if (Array.isArray(val) && val.length > 0) fieldErrors[key] = val[0];
          }
          setEditErrors(fieldErrors);
        } else {
          alert(json.error || "Failed to update user.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to API.");
    } finally {
      setSavingUser(false);
    }
  };

  const roleCards: { type: "USER" | "INFLUENCER" | "ADMIN"; label: string; icon: React.ReactNode }[] = [
    { type: "USER", label: "Standard", icon: <Users size={20} /> },
    { type: "INFLUENCER", label: "Influencer", icon: <Award size={20} /> },
    { type: "ADMIN", label: "Admin", icon: <Shield size={20} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel max-w-lg w-full flex flex-col gap-6 shadow-2xl relative border-border/80 bg-s1 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-t3 hover:text-t1 bg-s2 hover:bg-s3 border border-border/60 rounded-xl transition duration-150"
          disabled={savingUser}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold font-outfit text-t1 flex items-center gap-2">
            <Users className="text-purple" size={20} />
            <span>Edit User Role</span>
          </h2>
          <p className="text-xs text-t2 mt-1">Configure user account status and platform permissions.</p>
        </div>

        {/* User info card */}
        <div className="bg-s2/40 border border-border/40 p-4 rounded-2xl flex flex-col gap-1.5 text-xs text-t2 font-medium">
          <div className="flex justify-between">
            <span>Account Name:</span>
            <strong className="text-t1">{editingUser.name}</strong>
          </div>
          <div className="flex justify-between">
            <span>Email Address:</span>
            <strong className="text-t1">{editingUser.email}</strong>
          </div>
          <div className="flex justify-between">
            <span>Account ID:</span>
            <span className="text-t3 font-mono text-[10px]">{editingUser.id}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Role cards */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-t2 uppercase tracking-wider">Account Role</label>
            <div className="grid grid-cols-3 gap-3">
              {roleCards.map(({ type, label, icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setEditUserType(type);
                    if (type !== "INFLUENCER") {
                      setEditErrors((prev) => ({ ...prev, influencerType: "", influencerShare: "" }));
                    }
                  }}
                  disabled={savingUser}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                    editUserType === type
                      ? "bg-purple/10 border-purple text-purple shadow-md shadow-purple/5"
                      : "bg-s2/40 border-border/60 text-t2 hover:border-border hover:bg-s2/70 hover:text-t1"
                  }`}
                >
                  {icon}
                  <span className="text-xs font-bold font-outfit">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Influencer fields */}
          {editUserType === "INFLUENCER" && (
            <div className="flex flex-col gap-4 p-4 bg-s2/30 border border-border/65 rounded-2xl animate-fadeIn">
              {/* Platform */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-t2">Influencer Platform</label>
                {!customPlatformActive ? (
                  <select
                    value={standardPlatforms.includes(editInfluencerType) ? editInfluencerType : "Other"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") {
                        setCustomPlatformActive(true);
                        setEditInfluencerType("");
                      } else {
                        setEditInfluencerType(val);
                      }
                      setEditErrors((prev) => ({ ...prev, influencerType: "" }));
                    }}
                    className="w-full px-3 py-2 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm transition"
                    disabled={savingUser}
                  >
                    <option value="" disabled>Select Platform...</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Twitter / X">Twitter / X</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Twitch">Twitch</option>
                    <option value="Other">Other (Custom write-in)</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Substack, Blog, Podcast"
                      value={editInfluencerType}
                      onChange={(e) => {
                        setEditInfluencerType(e.target.value);
                        setEditErrors((prev) => ({ ...prev, influencerType: "" }));
                      }}
                      className="flex-1 px-3 py-2 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm transition"
                      disabled={savingUser}
                    />
                    <button
                      type="button"
                      onClick={() => { setCustomPlatformActive(false); setEditInfluencerType(""); }}
                      className="px-3 py-2 bg-s2 border border-border hover:bg-s3 text-t2 hover:text-t1 rounded-xl text-xs font-semibold transition"
                      disabled={savingUser}
                    >
                      Back
                    </button>
                  </div>
                )}
                {editErrors.influencerType && (
                  <span className="text-xs text-red font-medium">{editErrors.influencerType}</span>
                )}
              </div>

              {/* Share % */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-t2">Share Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 15.00"
                    value={editInfluencerShare || ""}
                    onChange={(e) => {
                      setEditInfluencerShare(Number(e.target.value));
                      setEditErrors((prev) => ({ ...prev, influencerShare: "" }));
                    }}
                    className="w-full pl-3 pr-8 py-2 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm transition font-mono"
                    disabled={savingUser}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-t2 text-sm font-semibold select-none">%</span>
                </div>
                {editErrors.influencerShare && (
                  <span className="text-xs text-red font-medium">{editErrors.influencerShare}</span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-border/80 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-s2 border border-border text-t2 hover:bg-s3 hover:text-t1 disabled:opacity-50 transition rounded-xl text-xs font-bold"
              disabled={savingUser}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-purple hover:bg-purple-dim text-t1 disabled:opacity-50 transition rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple/10"
              disabled={savingUser}
            >
              {savingUser && <Loader2 size={12} className="animate-spin" />}
              <span>{savingUser ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
