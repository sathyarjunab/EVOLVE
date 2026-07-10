"use client";

import { useAuth } from "../AuthContextProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Menu } from "lucide-react";

import { TabType, UserRecord } from "./components/types";
import AdminSidebar from "./components/AdminSidebar";
import DashboardView from "./components/DashboardView";
import ListUsersView from "./components/ListUsersView";
import CreateUserView from "./components/CreateUserView";
import ViewLinksModal from "./components/ViewLinksModal";
import EditUserModal from "./components/EditUserModal";
import DeleteUserModal from "./components/DeleteUserModal";
import AddLinkView from "./components/AddLinkView";

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Layout state
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Users list state (lifted here so EditUserModal can update the list)
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [fetching, setFetching] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  // Modal state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [viewingLinksInfluencer, setViewingLinksInfluencer] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch users whenever page, search, or auth user changes
  const fetchUsers = async () => {
    setFetching(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
      });
      if (activeTab === "influencers") {
        query.set("type", "INFLUENCER");
      }
      const res = await fetch(`/api/admin/users?${query.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalCount(json.pagination.totalCount);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && user.userType === "ADMIN") {
      fetchUsers();
    }
  }, [page, debouncedSearch, user, activeTab]);

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-t1 font-sans">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-purple-dim rounded-full" />
          <div className="absolute inset-0 border-4 border-t-purple border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-t2 font-medium tracking-wide">Securing connection...</p>
      </div>
    );
  }

  // ── Access denied ──────────────────────────────────────────────
  if (!user || user.userType !== "ADMIN") {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-t1 font-sans">
        <div className="glass-panel max-w-md w-full text-center flex flex-col items-center gap-6 shadow-2xl border-red/20">
          <div className="w-16 h-16 bg-red/10 border border-red/30 rounded-full flex items-center justify-center text-red">
            <ShieldAlert size={36} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-t1 font-outfit mb-2">
              Admin Access Required
            </h1>
            <p className="text-sm text-t2 leading-relaxed">
              Your account does not possess administrator privileges. If you believe
              this is an error, please contact system management.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-3 bg-purple text-t1 hover:bg-purple-dim transition duration-200 font-semibold rounded-lg text-sm shadow-md"
            >
              Sign In as Admin
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

  // ── Authenticated admin layout ─────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-t1 font-sans flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-s1 border-b border-border px-6 py-4 z-40">
        <div className="flex items-center gap-2">
          <span className="font-outfit font-extrabold text-xl tracking-wider text-t1">
            EVOLVE<span className="text-lime">.</span>
          </span>
          <span className="text-xs bg-lime/10 text-lime border border-lime/30 px-2 py-0.5 rounded font-mono font-bold">
            ADMIN
          </span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-t2 hover:text-t1 transition duration-200"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        user={user}
        logout={logout}
      />

      {/* Mobile backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen p-6 md:p-10 max-w-7xl mx-auto w-full">
        {activeTab === "dashboard" && <DashboardView />}

        {activeTab === "users" && (
          <ListUsersView
            users={users}
            search={search}
            setSearch={setSearch}
            debouncedSearch={debouncedSearch}
            page={page}
            setPage={setPage}
            limit={limit}
            totalPages={totalPages}
            totalCount={totalCount}
            fetching={fetching}
            fetchUsers={fetchUsers}
            onEditUser={setEditingUser}
            onDeleteUser={setDeletingUser}
          />
        )}

        {activeTab === "create_user" && (
          <CreateUserView
            onCreated={() => {
              // Refresh the cached list so the new user is present when the
              // admin navigates back to "List Users".
              fetchUsers();
            }}
          />
        )}

        {activeTab === "influencers" && (
          <ListUsersView
            users={users}
            search={search}
            setSearch={setSearch}
            debouncedSearch={debouncedSearch}
            page={page}
            setPage={setPage}
            limit={limit}
            totalPages={totalPages}
            totalCount={totalCount}
            fetching={fetching}
            fetchUsers={fetchUsers}
            onViewLinks={setViewingLinksInfluencer}
            onDeleteUser={setDeletingUser}
            filterType="INFLUENCER"
          />
        )}

        {activeTab === "add_link" && <AddLinkView />}
      </main>

      {/* Edit user modal */}
      {editingUser && (
        <EditUserModal
          editingUser={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            setEditingUser(null);
          }}
        />
      )}

      {/* View influencer links modal */}
      {viewingLinksInfluencer && (
        <ViewLinksModal
          influencer={viewingLinksInfluencer}
          onClose={() => setViewingLinksInfluencer(null)}
        />
      )}

      {/* Delete user confirmation modal */}
      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDeleted={(id) => {
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setTotalCount((prev) => Math.max(0, prev - 1));
            setDeletingUser(null);
          }}
        />
      )}
    </div>
  );
}
