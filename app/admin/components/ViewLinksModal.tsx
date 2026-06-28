"use client";

import { useEffect, useState } from "react";
import {
  X,
  Ticket,
  Loader2,
  Copy,
  Check,
  Trash2,
  Plus,
  Wand2,
  Percent,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { UserRecord, formatDate } from "./types";

// ─── Types ────────────────────────────────────────────────────────
type CouponCodeType = "FLAT" | "PERCENTAGE";

interface CouponRecord {
  id: string;
  influencerId: string;
  code: string;
  couponCodeType: CouponCodeType;
  // Prisma Decimal is serialized to a string over JSON
  discountValue: string;
  createdAt: string;
  updatedAt: string;
}

interface ViewLinksModalProps {
  influencer: UserRecord;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────
const TYPE_META: Record<CouponCodeType, { label: string; short: string; icon: React.ReactNode; cls: string }> = {
  FLAT: {
    label: "Flat Discount",
    short: "FLAT",
    icon: <DollarSign size={11} />,
    cls: "bg-lime/10 text-lime border-lime/30",
  },
  PERCENTAGE: {
    label: "Percentage Off",
    short: "%OFF",
    icon: <Percent size={11} />,
    cls: "bg-purple/10 text-purple border-purple/30",
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function ViewLinksModal({ influencer, onClose }: ViewLinksModalProps) {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [codeInput, setCodeInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [codeType, setCodeType] = useState<CouponCodeType>("PERCENTAGE");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/influencer-links?influencerId=${influencer.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setCoupons(json.data);
      } else {
        toast.error(json.error || "Failed to load coupon codes.");
      }
    } catch {
      toast.error("Failed to connect to API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [influencer.id]);

  // ── Create ────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validate discount value ──────────────────────────────────
    const discountValue = Number(discountInput);
    if (!discountInput.trim() || Number.isNaN(discountValue) || discountValue <= 0) {
      toast.error("Enter a discount value greater than 0.");
      return;
    }
    if (codeType === "PERCENTAGE" && discountValue > 100) {
      toast.error("Percentage discount cannot exceed 100.");
      return;
    }

    setAdding(true);
    try {
      const payload: Record<string, string | number> = {
        influencerId: influencer.id,
        couponCodeType: codeType,
        discountValue,
      };
      if (codeInput.trim()) payload.code = codeInput.trim();

      const res = await fetch("/api/admin/influencer-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setCoupons((prev) => [json.data, ...prev]);
        setCodeInput("");
        setDiscountInput("");
        toast.success(`Coupon code "${json.data.code}" created.`);
      } else {
        // 409 = duplicate code — show as destructive toast
        if (res.status === 409) {
          toast.error(json.error, { duration: 5000 });
        } else {
          toast.error(json.error || "Failed to create coupon code.");
        }
      }
    } catch {
      toast.error("Failed to connect to API.");
    } finally {
      setAdding(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon code "${code}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/influencer-links?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        toast.success(`Coupon code "${code}" deleted.`);
      } else {
        toast.error(json.error || "Failed to delete.");
      }
    } catch {
      toast.error("Failed to connect to API.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Copy ───────────────────────────────────────────────────────
  const handleCopy = (coupon: CouponRecord) => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(`Copied "${coupon.code}" to clipboard.`);
  };

  // ── Render ─────────────────────────────────────────────────────
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
            <Ticket className="text-lime" size={20} />
            <span>Coupon Codes</span>
          </h2>
          <p className="text-xs text-t2 mt-1">
            Create and manage discount coupon codes for this influencer.
          </p>
        </div>

        {/* Influencer info card */}
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

        {/* ── Create coupon form ─────────────────────────────────── */}
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <label className="text-xs font-bold text-t2 uppercase tracking-wider">
            Create New Coupon Code
          </label>

          {/* Discount type toggle */}
          <div className="flex gap-2">
            {(["PERCENTAGE", "FLAT"] as CouponCodeType[]).map((type) => {
              const meta = TYPE_META[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCodeType(type)}
                  disabled={adding}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                    codeType === type
                      ? meta.cls + " border-current shadow-sm"
                      : "bg-s2/40 border-border/60 text-t2 hover:border-border hover:text-t1"
                  }`}
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Discount value input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-t3 pointer-events-none">
              {codeType === "PERCENTAGE" ? <Percent size={13} /> : <DollarSign size={13} />}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={codeType === "PERCENTAGE" ? 100 : undefined}
              step="0.01"
              placeholder={codeType === "PERCENTAGE" ? "Discount percentage (e.g. 20)" : "Flat discount amount (e.g. 100)"}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm font-mono text-t1 placeholder:font-sans placeholder:text-t3 transition"
              disabled={adding}
            />
          </div>

          {/* Code input + submit */}
          <div className="flex gap-2 items-stretch">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Leave blank to auto-generate"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                maxLength={100}
                className="w-full px-3 py-2.5 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm font-mono text-t1 placeholder:font-sans placeholder:text-t3 transition uppercase tracking-wider"
                disabled={adding}
              />
              {!codeInput && (
                <span className="absolute inset-y-0 right-3 flex items-center gap-1 text-t3 text-[10px] pointer-events-none select-none">
                  <Wand2 size={11} />
                  auto
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2.5 bg-purple hover:bg-purple-dim text-t1 disabled:opacity-50 transition rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple/10 shrink-0"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>Create</span>
            </button>
          </div>

          <p className="text-[10px] text-t3 leading-relaxed">
            Codes are case-insensitive. Use only letters, numbers, hyphens and underscores. Leave the field blank to auto-generate a random code.
          </p>
        </form>

        {/* ── Coupons list ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-t2 uppercase tracking-wider">
            Active Coupon Codes ({coupons.length})
          </label>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-purple" size={24} />
              <span className="text-xs text-t3 font-medium">Loading coupon records...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-10 px-4 text-center flex flex-col items-center gap-2 bg-s2/10">
              <span className="text-t3"><Ticket size={24} /></span>
              <strong className="text-t2 text-xs font-semibold">No coupon codes yet</strong>
              <p className="text-[11px] text-t3 max-w-[260px]">
                Create a coupon code above. You can provide your own code or let the system generate one.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[32vh] overflow-y-auto pr-1">
              {coupons.map((coupon) => {
                const meta = TYPE_META[coupon.couponCodeType];
                const amount = Number(coupon.discountValue);
                const discountLabel =
                  coupon.couponCodeType === "PERCENTAGE" ? `${amount}% OFF` : `$${amount} OFF`;
                return (
                  <div
                    key={coupon.id}
                    className="flex items-center justify-between gap-3 p-3 bg-s2/40 border border-border/50 hover:border-purple/30 rounded-xl transition duration-150"
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-mono font-bold text-t1 tracking-widest truncate"
                          title={coupon.code}
                        >
                          {coupon.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider border px-2 py-0.5 rounded-md font-mono shrink-0 ${meta.cls}`}
                        >
                          {meta.icon}
                          {discountLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-t3">
                        Created {formatDate(coupon.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(coupon)}
                        title="Copy code"
                        className="p-2 bg-s2 hover:bg-s3 text-t2 hover:text-t1 border border-border/60 hover:border-border rounded-lg transition duration-150"
                      >
                        {copiedId === coupon.id ? (
                          <Check size={13} className="text-lime" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        disabled={deletingId === coupon.id}
                        title="Delete coupon"
                        className="p-2 bg-s2 hover:bg-s3 text-red/80 hover:text-red border border-border/60 hover:border-red/20 rounded-lg transition duration-150 disabled:opacity-50"
                      >
                        {deletingId === coupon.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/80 pt-4 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-s2 border border-border text-t2 hover:bg-s3 hover:text-t1 transition rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
