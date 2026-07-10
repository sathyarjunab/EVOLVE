"use client";

import { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { UserRecord } from "./types";

interface DeleteUserModalProps {
  user: UserRecord;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export default function DeleteUserModal({ user, onClose, onDeleted }: DeleteUserModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        onDeleted(user.id);
      } else {
        setError(json.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel max-w-md w-full flex flex-col gap-6 shadow-2xl relative border-red/20 bg-s1 p-6 md:p-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-t3 hover:text-t1 bg-s2 hover:bg-s3 border border-border/60 rounded-xl transition duration-150"
          disabled={deleting}
        >
          <X size={18} />
        </button>

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red/10 border border-red/30 rounded-2xl flex items-center justify-center text-red">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-outfit text-t1">Delete this user?</h2>
            <p className="text-xs text-t2 mt-1 leading-relaxed">
              This permanently removes the account and all associated data (habits,
              budgets, savings, transactions and referral links). This action cannot be
              undone.
            </p>
          </div>
        </div>

        {/* Target user card */}
        <div className="bg-s2/40 border border-border/40 p-4 rounded-2xl flex flex-col gap-1.5 text-xs text-t2 font-medium">
          <div className="flex justify-between">
            <span>Account Name:</span>
            <strong className="text-t1">{user.name}</strong>
          </div>
          <div className="flex justify-between">
            <span>Email Address:</span>
            <strong className="text-t1">{user.email}</strong>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 py-2.5 px-3.5 bg-red/10 border border-red/30 rounded-xl text-xs text-red font-medium">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-border/80 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-s2 border border-border text-t2 hover:bg-s3 hover:text-t1 disabled:opacity-50 transition rounded-xl text-xs font-bold"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2.5 bg-red hover:bg-red/90 text-white disabled:opacity-50 transition rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red/10"
            disabled={deleting}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{deleting ? "Deleting..." : "Delete User"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
