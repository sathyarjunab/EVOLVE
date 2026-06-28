"use client";

import { useAuth } from "../AuthContextProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Search,
  Loader2,
  Users,
  Wallet,
  Percent,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Inbox,
} from "lucide-react";
import { formatDate } from "../admin/components/types";

// ─── Types ────────────────────────────────────────────────────────
interface ReferralRow {
  mappingId: string;
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
  referredAt: string;
  earnings: string; // Decimal serialized as string
}

interface Summary {
  totalEarnings: string | number;
  totalReferrals: number;
  sharePercent: string | number;
}

const LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────
const formatMoney = (value: string | number): string =>
  Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Page ─────────────────────────────────────────────────────────
export default function InfluencerPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [fetching, setFetching] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch referrals whenever page / search / auth changes
  useEffect(() => {
    const fetchReferrals = async () => {
      setFetching(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          search: debouncedSearch,
        });
        const res = await fetch(`/api/influencer/referrals?${query.toString()}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setRows(json.data);
          setSummary(json.summary);
          setTotalPages(json.pagination.totalPages);
          setTotalCount(json.pagination.totalCount);
        }
      } catch (err) {
        console.error("Failed to fetch referrals:", err);
      } finally {
        setFetching(false);
      }
    };

    if (user && user.userType === "INFLUENCER") {
      fetchReferrals();
    }
  }, [page, debouncedSearch, user]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-t1 font-sans">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-purple-dim rounded-full" />
          <div className="absolute inset-0 border-4 border-t-purple border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-t2 font-medium tracking-wide">Loading dashboard...</p>
      </div>
    );
  }

  // ── Access denied ────────────────────────────────────────────────
  if (!user || user.userType !== "INFLUENCER") {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-t1 font-sans">
        <div className="glass-panel max-w-md w-full text-center flex flex-col items-center gap-6 shadow-2xl border-red/20">
          <div className="w-16 h-16 bg-red/10 border border-red/30 rounded-full flex items-center justify-center text-red">
            <ShieldAlert size={36} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-t1 font-outfit mb-2">
              Influencer Access Required
            </h1>
            <p className="text-sm text-t2 leading-relaxed">
              This dashboard is only available to influencer accounts. If you
              believe this is an error, please contact support.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-3 bg-purple text-t1 hover:bg-purple-dim transition duration-200 font-semibold rounded-lg text-sm shadow-md"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/landing")}
              className="w-full py-3 bg-s2 border border-border text-t2 hover:bg-s3 hover:text-t1 transition duration-200 font-semibold rounded-lg text-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-t1 font-sans">
      <main className="max-w-6xl mx-auto w-full p-6 md:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-t2 mt-1">
              Track the users you&apos;ve referred and the earnings you&apos;ve made.
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-s2 border border-border text-t2 hover:bg-s3 hover:text-t1 transition rounded-xl text-xs font-bold"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            icon={<Wallet size={18} />}
            label="Total Earnings"
            value={summary ? formatMoney(summary.totalEarnings) : "—"}
            accent="lime"
          />
          <SummaryCard
            icon={<Users size={18} />}
            label="Total Referrals"
            value={summary ? summary.totalReferrals.toString() : "—"}
            accent="purple"
          />
          <SummaryCard
            icon={<Percent size={18} />}
            label="Your Share"
            value={summary ? `${Number(summary.sharePercent)}%` : "—"}
            accent="purple"
          />
        </div>

        {/* Referrals table */}
        <div className="glass-panel bg-s1 border-border/80 p-5 md:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-bold text-t2 uppercase tracking-wider">
              Referred Users ({totalCount})
            </h2>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center text-t3 pointer-events-none">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm text-t1 placeholder:text-t3 transition"
              />
            </div>
          </div>

          {/* Body */}
          {fetching ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-purple" size={24} />
              <span className="text-xs text-t3 font-medium">Loading referrals...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-14 px-4 text-center flex flex-col items-center gap-2 bg-s2/10">
              <span className="text-t3"><Inbox size={28} /></span>
              <strong className="text-t2 text-sm font-semibold">No referrals yet</strong>
              <p className="text-xs text-t3 max-w-[280px]">
                {debouncedSearch
                  ? "No referred users match your search."
                  : "When someone buys using your coupon code, they'll show up here."}
              </p>
            </div>
          ) : (
            <>
              {/* Table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-t3 border-b border-border/60">
                      <th className="py-2.5 pr-4 font-bold">Name</th>
                      <th className="py-2.5 pr-4 font-bold">Email</th>
                      <th className="py-2.5 pr-4 font-bold">Referred</th>
                      <th className="py-2.5 pl-4 font-bold text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.mappingId}
                        className="border-b border-border/40 hover:bg-s2/30 transition"
                      >
                        <td className="py-3 pr-4 font-medium text-t1">{r.name}</td>
                        <td className="py-3 pr-4 text-t2">{r.email}</td>
                        <td className="py-3 pr-4 text-t3 text-xs">
                          {formatDate(r.referredAt)}
                        </td>
                        <td className="py-3 pl-4 text-right font-mono font-bold text-lime">
                          {formatMoney(r.earnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden flex flex-col gap-2">
                {rows.map((r) => (
                  <div
                    key={r.mappingId}
                    className="p-3 bg-s2/40 border border-border/50 rounded-xl flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-t1 truncate">{r.name}</span>
                      <span className="font-mono font-bold text-lime shrink-0">
                        {formatMoney(r.earnings)}
                      </span>
                    </div>
                    <span className="text-xs text-t2 truncate">{r.email}</span>
                    <span className="text-[10px] text-t3">
                      Referred {formatDate(r.referredAt)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <span className="text-xs text-t3">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || fetching}
                  className="flex items-center gap-1 px-3 py-1.5 bg-s2 border border-border text-t2 hover:text-t1 hover:bg-s3 disabled:opacity-40 disabled:cursor-not-allowed transition rounded-lg text-xs font-bold"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || fetching}
                  className="flex items-center gap-1 px-3 py-1.5 bg-s2 border border-border text-t2 hover:text-t1 hover:bg-s3 disabled:opacity-40 disabled:cursor-not-allowed transition rounded-lg text-xs font-bold"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────
function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "lime" | "purple";
}) {
  const accentCls =
    accent === "lime"
      ? "bg-lime/10 text-lime border-lime/30"
      : "bg-purple/10 text-purple border-purple/30";
  return (
    <div className="glass-panel bg-s1 border-border/80 p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${accentCls}`}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-t3 font-bold">
          {label}
        </span>
        <span className="text-xl font-bold font-outfit text-t1 truncate">
          {value}
        </span>
      </div>
    </div>
  );
}
