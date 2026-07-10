"use client";

import { useState } from "react";
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Wallet,
  LayoutGrid,
  Mail,
} from "lucide-react";
import { UserRecord } from "./types";

type TrackerPreset = "habit" | "money" | "combined";

interface CreateUserViewProps {
  // Called after a user is successfully created so the parent can refresh
  // the users list and/or navigate away.
  onCreated?: (user: UserRecord) => void;
}

const trackerOptions: {
  value: TrackerPreset;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "habit",
    label: "Habit Tracker",
    description: "Daily habits & streaks only.",
    icon: <ListChecks size={20} />,
  },
  {
    value: "money",
    label: "Money Tracker",
    description: "Budget & savings only.",
    icon: <Wallet size={20} />,
  },
  {
    value: "combined",
    label: "Combined",
    description: "Both habit & money trackers.",
    icon: <LayoutGrid size={20} />,
  },
];

export default function CreateUserView({ onCreated }: CreateUserViewProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tracker, setTracker] = useState<TrackerPreset>("combined");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    email: string;
    emailSent: boolean;
  } | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setTracker("combined");
    setErrors({});
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 3) {
      nextErrors.name = "Name must be at least 3 characters long.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), tracker }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setResult({ email: json.data.email, emailSent: json.emailSent });
        onCreated?.(json.data as UserRecord);
      } else if (json.details) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries(json.details)) {
          if (Array.isArray(val) && val.length > 0) fieldErrors[key] = val[0] as string;
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ form: json.error || "Failed to create user." });
      }
    } catch (err) {
      console.error(err);
      setErrors({ form: "Failed to connect to the server." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn max-w-lg mx-auto w-full py-10">
        <div className="glass-panel bg-s1 border-border/80 p-8 flex flex-col items-center text-center gap-5 rounded-2xl">
          <div className="w-16 h-16 bg-lime/10 border border-lime/30 rounded-2xl flex items-center justify-center text-lime">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-outfit text-t1">User created</h2>
            <p className="text-sm text-t2 mt-1">
              Account for <strong className="text-t1">{result.email}</strong> is ready.
            </p>
          </div>

          {result.emailSent ? (
            <div className="w-full flex items-center gap-2.5 py-3 px-4 bg-s2/50 border border-border/60 rounded-xl text-xs text-t2 font-medium">
              <Mail size={16} className="text-lime shrink-0" />
              <span>
                A welcome email with temporary login credentials has been sent to the user.
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center gap-2.5 py-3 px-4 bg-red/10 border border-red/30 rounded-xl text-xs text-red font-medium text-left">
              <AlertTriangle size={16} className="shrink-0" />
              <span>
                The account was created, but the credentials email failed to send. Please
                share the login details with the user manually, or reset their password.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 w-full pt-1">
            <button
              onClick={resetForm}
              className="flex-1 py-2.5 bg-purple hover:bg-purple-dim text-t1 transition rounded-xl text-xs font-bold shadow-lg shadow-purple/10"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-lg mx-auto w-full py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold font-outfit text-t1 flex items-center gap-2">
          <UserPlus className="text-purple" size={22} />
          <span>Create User</span>
        </h1>
        <p className="text-sm text-t2">
          Create a new account and assign tracker access. A temporary password is
          generated automatically and emailed to the user.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel bg-s1 border-border/80 p-6 md:p-8 flex flex-col gap-5 rounded-2xl"
      >
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-t2 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g. Jane Doe"
            className="w-full px-3 py-2.5 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm transition"
            disabled={submitting}
          />
          {errors.name && (
            <span className="text-xs text-red font-medium">{errors.name}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-t2 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="e.g. jane@example.com"
            className="w-full px-3 py-2.5 bg-s2 border border-border focus:border-purple focus:outline-none rounded-xl text-sm transition"
            disabled={submitting}
          />
          {errors.email && (
            <span className="text-xs text-red font-medium">{errors.email}</span>
          )}
        </div>

        {/* Tracker preset */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-t2 uppercase tracking-wider">
            Tracker Access
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {trackerOptions.map(({ value, label, description, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTracker(value)}
                disabled={submitting}
                className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  tracker === value
                    ? "bg-purple/10 border-purple text-purple shadow-md shadow-purple/5"
                    : "bg-s2/40 border-border/60 text-t2 hover:border-border hover:bg-s2/70 hover:text-t1"
                }`}
              >
                {icon}
                <span className="text-xs font-bold font-outfit">{label}</span>
                <span className="text-[10px] leading-snug opacity-80">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {errors.form && (
          <div className="flex items-center gap-2 py-2.5 px-3.5 bg-red/10 border border-red/30 rounded-xl text-xs text-red font-medium">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 border-t border-border/80 pt-5 mt-1">
          <button
            type="submit"
            className="flex-1 py-3 bg-purple hover:bg-purple-dim text-t1 disabled:opacity-50 transition rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple/10"
            disabled={submitting}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <span>{submitting ? "Creating User..." : "Create User & Send Email"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
