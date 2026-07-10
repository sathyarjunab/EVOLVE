"use client";

import {
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { UserRecord, formatDate, getAccessDetails } from "./types";

interface ListUsersViewProps {
  users: UserRecord[];
  search: string;
  setSearch: (v: string) => void;
  debouncedSearch: string;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  totalPages: number;
  totalCount: number;
  fetching: boolean;
  fetchUsers: () => void;
  onEditUser?: (user: UserRecord) => void;
  onViewLinks?: (user: UserRecord) => void;
  onDeleteUser?: (user: UserRecord) => void;
  filterType?: "USER" | "INFLUENCER" | "ADMIN" | "ALL";
}

export default function ListUsersView({
  users,
  search,
  setSearch,
  debouncedSearch,
  page,
  setPage,
  limit,
  totalPages,
  totalCount,
  fetching,
  fetchUsers,
  onEditUser,
  onViewLinks,
  onDeleteUser,
  filterType = "ALL",
}: ListUsersViewProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-t1">
            {filterType === "INFLUENCER" ? "Influencer Directory" : "User Directory"}
          </h1>
          <p className="text-sm text-t2 mt-1">
            {filterType === "INFLUENCER"
              ? "Manage influencer accounts, verify custom platform categories, and adjust referral rates."
              : "Manage user accounts, check tracker permissions, and verify engagement metrics."}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={fetching}
          className="self-start sm:self-center flex items-center justify-center gap-2 px-4 py-2.5 bg-s1 hover:bg-s2 border border-border text-t2 hover:text-t1 disabled:opacity-50 transition rounded-xl text-xs font-bold"
        >
          <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-t3">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-s2 border border-border hover:border-border/80 focus:border-purple focus:outline-none rounded-xl text-sm transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-t3 hover:text-t1 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="w-full md:w-auto flex items-center justify-end gap-3 text-xs text-t2 font-medium">
          {debouncedSearch && (
            <span className="bg-s2 border border-border/80 px-3 py-1.5 rounded-lg">
              Matching Results: <strong className="text-t1">{totalCount}</strong>
            </span>
          )}
          <span className="bg-s2 border border-border/80 px-3 py-1.5 rounded-lg">
            {filterType === "INFLUENCER" ? "Total Influencers: " : "Total Users: "}
            <strong className="text-t1">{totalCount}</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-s2/40 text-t2 text-xs font-bold tracking-wider uppercase">
                <th className="px-6 py-4">{filterType === "INFLUENCER" ? "Influencer Details" : "User Details"}</th>
                {filterType === "INFLUENCER" ? (
                  <>
                    <th className="px-6 py-4">Platform</th>
                    <th className="px-6 py-4 text-center">Share Rate</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4">Security Level</th>
                    <th className="px-6 py-4 text-center">Module Access</th>
                  </>
                )}
                <th className="px-6 py-4">Registration</th>
                <th className="px-6 py-4">Last Connection</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {fetching ? (
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-s2/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-s2"></div>
                        <div className="flex flex-col gap-1.5">
                          <div className="h-4 bg-s2 rounded w-28"></div>
                          <div className="h-3 bg-s2 rounded w-40"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-5 bg-s2 rounded w-20 animate-pulse"></div></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 animate-pulse">
                        <div className="h-5 bg-s2 rounded w-16"></div>
                        <div className="h-5 bg-s2 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-s2 rounded w-24 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-s2 rounded w-24 animate-pulse"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-s2 rounded w-14 ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-s2 border border-border/80 rounded-full flex items-center justify-center text-t3">
                        <Search size={22} />
                      </div>
                      <h3 className="text-base font-bold font-outfit text-t1">
                        {filterType === "INFLUENCER" ? "No Influencers Located" : "No Users Located"}
                      </h3>
                      <p className="text-xs text-t2 max-w-sm leading-relaxed">
                        {filterType === "INFLUENCER"
                          ? "We could not find any influencers corresponding to that keyword query. Check spelling or clear filters to reset."
                          : "We could not find any accounts corresponding to that keyword query. Check spelling or clear filters to reset."}
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="mt-2 px-4 py-2 bg-s2 hover:bg-s3 text-t1 border border-border rounded-xl text-xs font-semibold transition"
                        >
                          Clear Search Query
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const acc = getAccessDetails(item.access);
                  return (
                    <tr key={item.id} className="hover:bg-s2/20 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-s2 border border-border/80 flex items-center justify-center font-bold text-xs text-t1 group-hover:border-purple/30 group-hover:bg-purple/5 transition duration-150">
                            {item.name ? item.name[0].toUpperCase() : "U"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-t1 truncate max-w-[160px]">{item.name}</span>
                            <span className="text-xs text-t2 truncate max-w-[200px]">{item.email}</span>
                          </div>
                        </div>
                      </td>
                      {filterType === "INFLUENCER" ? (
                        <>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center text-[10px] font-extrabold tracking-wider bg-purple/10 text-purple border border-purple/30 px-2.5 py-0.5 rounded-md uppercase font-mono">
                              {item.influencerType || "Other"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-t1 font-mono">
                              {item.influencerShare ? `${Number(item.influencerShare)}%` : "0%"}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            {item.userType === "ADMIN" ? (
                              <span className="inline-flex items-center text-[10px] font-extrabold tracking-wider bg-lime/10 text-lime border border-lime/30 px-2 py-0.5 rounded-md uppercase font-mono">Admin</span>
                            ) : item.userType === "INFLUENCER" ? (
                              <span className="inline-flex items-center text-[10px] font-extrabold tracking-wider bg-purple/10 text-purple border border-purple/30 px-2 py-0.5 rounded-md uppercase font-mono">Influencer</span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold tracking-wider bg-s2 text-t2 border border-border px-2 py-0.5 rounded-md uppercase font-mono">User</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                                  acc.habit_tracker ? "bg-grn/10 text-grn border-grn/20" : "bg-s2 text-t3 border-border/40"
                                }`}
                                title={acc.habit_tracker ? "Habit Tracker Active" : "Habit Tracker Disabled"}
                              >
                                {acc.habit_tracker ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                <span>Habit</span>
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                                  acc.money_tracker ? "bg-grn/10 text-grn border-grn/20" : "bg-s2 text-t3 border-border/40"
                                }`}
                                title={acc.money_tracker ? "Money Tracker Active" : "Money Tracker Disabled"}
                              >
                                {acc.money_tracker ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                <span>Money</span>
                              </span>
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-xs text-t2 font-medium">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-xs text-t2 font-medium">
                        {item.lastLogin ? formatDate(item.lastLogin) : <span className="text-t3 font-normal italic">Never</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {filterType === "INFLUENCER" ? (
                            <button
                              onClick={() => onViewLinks?.(item)}
                              className="px-3 py-1.5 bg-s2 hover:bg-s3 text-lime/80 hover:text-lime border border-border/60 hover:border-lime/30 transition duration-200 rounded-lg text-xs font-semibold"
                            >
                              View Coupons
                            </button>
                          ) : (
                            <button
                              onClick={() => onEditUser?.(item)}
                              className="px-3 py-1.5 bg-s2 hover:bg-s3 text-t2 hover:text-t1 border border-border/60 hover:border-border transition duration-200 rounded-lg text-xs font-semibold"
                            >
                              Edit User
                            </button>
                          )}
                          {onDeleteUser && (
                            <button
                              onClick={() => onDeleteUser(item)}
                              title="Delete user"
                              aria-label={`Delete ${item.name}`}
                              className="p-1.5 bg-s2 hover:bg-red/10 text-t3 hover:text-red border border-border/60 hover:border-red/30 transition duration-200 rounded-lg"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!fetching && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-s1 border-t border-border">
            <div className="text-xs text-t2 font-medium">
              Showing <span className="text-t1">{(page - 1) * limit + 1}</span> to{" "}
              <span className="text-t1">{Math.min(page * limit, totalCount)}</span> of{" "}
              <span className="text-t1">{totalCount}</span> {filterType === "INFLUENCER" ? "influencer" : "user"} profiles
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 bg-s2 border border-border hover:bg-s3 text-t2 hover:text-t1 disabled:opacity-40 disabled:hover:bg-s2 disabled:hover:text-t2 rounded-lg transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const p = index + 1;
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-xs font-bold border rounded-lg transition ${
                        page === p
                          ? "bg-purple border-purple text-t1 font-extrabold shadow-lg shadow-purple/10"
                          : "bg-s2 border-border text-t2 hover:bg-s3 hover:text-t1"
                      }`}
                    >
                      {p}
                    </button>
                  );
                } else if (p === page - 2 || p === page + 2) {
                  return <span key={p} className="text-t3 px-1 text-xs font-bold select-none">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 bg-s2 border border-border hover:bg-s3 text-t2 hover:text-t1 disabled:opacity-40 disabled:hover:bg-s2 disabled:hover:text-t2 rounded-lg transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
