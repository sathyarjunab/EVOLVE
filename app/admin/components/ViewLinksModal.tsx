"use client";

import { useEffect, useState } from "react";
import {
  X,
  Link2,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Plus,
} from "lucide-react";
import { UserRecord, formatDate } from "./types";

interface InfluencerLinkRecord {
  id: string;
  influencerId: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

interface ViewLinksModalProps {
  influencer: UserRecord;
  onClose: () => void;
}

export default function ViewLinksModal({ influencer, onClose }: ViewLinksModalProps) {
  const [links, setLinks] = useState<InfluencerLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLinkVal, setNewLinkVal] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchLinks = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/influencer-links?influencerId=${influencer.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLinks(json.data);
      } else {
        setErrorMsg(json.error || "Failed to load links.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [influencer.id]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkVal.trim()) return;

    setAdding(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/influencer-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerId: influencer.id,
          link: newLinkVal.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLinks((prev) => [json.data, ...prev]);
        setNewLinkVal("");
        setSuccessMsg("Referral link added successfully.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(json.error || "Failed to add link.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to API.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this referral link?")) return;

    setDeletingId(id);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/admin/influencer-links?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLinks((prev) => prev.filter((link) => link.id !== id));
        setSuccessMsg("Referral link deleted.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(json.error || "Failed to delete link.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to API.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (linkRecord: InfluencerLinkRecord) => {
    navigator.clipboard.writeText(linkRecord.link);
    setCopiedId(linkRecord.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel max-w-xl w-full flex flex-col gap-6 shadow-2xl relative border-border/80 bg-s1 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-t3 hover:text-t1 bg-s2 hover:bg-s3 border border-border/60 rounded-xl transition duration-150"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold font-outfit text-t1 flex items-center gap-2">
            <Link2 className="text-lime animate-pulse" size={20} />
            <span>Influencer Referral Links</span>
          </h2>
          <p className="text-xs text-t2 mt-1">
            View, generate, or manage referral and tracking URLs for this influencer.
          </p>
        </div>

        {/* Influencer Profile info card */}
        <div className="bg-s2/40 border border-border/40 p-4 rounded-2xl flex items-center justify-between text-xs text-t2 font-medium">
          <div className="flex flex-col gap-1">
            <span className="text-t3 uppercase tracking-wider text-[10px] font-bold">Influencer</span>
            <strong className="text-t1 text-sm font-outfit">{influencer.name}</strong>
            <span className="text-t2">{influencer.email}</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span className="text-t3 uppercase tracking-wider text-[10px] font-bold">Platform / Share</span>
            <span className="inline-flex items-center text-[10px] font-extrabold tracking-wider bg-purple/10 text-purple border border-purple/30 px-2 py-0.5 rounded-md uppercase font-mono self-end">
              {influencer.influencerType || "Other"}
            </span>
            <strong className="text-t1 font-mono text-xs">{Number(influencer.influencerShare)}% Share Rate</strong>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 bg-red/10 border border-red/20 text-red text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-grn/10 border border-grn/20 text-grn text-xs rounded-xl font-medium">
            {successMsg}
          </div>
        )}

        {/* Add Link Form */}
        <form onSubmit={handleAddLink} className="flex flex-col gap-2">
          <label className="text-xs font-bold text-t2 uppercase tracking-wider">
            Create New Referral Link
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              required
              placeholder="e.g. https://evolve.com/ref/influencer-code"
              value={newLinkVal}
              onChange={(e) => setNewLinkVal(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm transition font-mono text-t1 placeholder:font-sans placeholder:text-t3"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newLinkVal}
              className="px-4 py-2.5 bg-purple hover:bg-purple-dim text-t1 disabled:opacity-50 transition rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple/10"
            >
              {adding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              <span>Create Link</span>
            </button>
          </div>
        </form>

        {/* Links List */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-t2 uppercase tracking-wider">
            Associated Referral Links ({links.length})
          </label>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-purple" size={24} />
              <span className="text-xs text-t3 font-medium">Retrieving link records...</span>
            </div>
          ) : links.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-10 px-4 text-center flex flex-col items-center gap-2 bg-s2/10">
              <span className="text-t3"><Link2 size={24} /></span>
              <strong className="text-t2 text-xs font-semibold">No referral links registered yet</strong>
              <p className="text-[11px] text-t3 max-w-[280px]">
                Create a new referral URL above to track statistics for this influencer.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 p-3 bg-s2/40 border border-border/50 hover:border-purple/35 rounded-xl transition duration-150"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-xs font-mono font-medium text-t1 truncate" title={link.link}>
                      {link.link}
                    </span>
                    <span className="text-[10px] text-t3">
                      Created: {formatDate(link.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(link)}
                      title="Copy URL"
                      className="p-2 bg-s2 hover:bg-s3 text-t2 hover:text-t1 border border-border/60 hover:border-border rounded-lg transition duration-150"
                    >
                      {copiedId === link.id ? (
                        <Check size={13} className="text-grn" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <a
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Link"
                      className="p-2 bg-s2 hover:bg-s3 text-t2 hover:text-t1 border border-border/60 hover:border-border rounded-lg transition duration-150"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={deletingId === link.id}
                      title="Delete Link"
                      className="p-2 bg-s2 hover:bg-s3 text-red/80 hover:text-red border border-border/60 hover:border-red/20 rounded-lg transition duration-150 disabled:opacity-50"
                    >
                      {deletingId === link.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border/80 pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-s2 border border-border text-t2 hover:bg-s3 hover:text-t1 transition rounded-xl text-xs font-bold"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
