"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
      } else {
        setSent(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime opacity-10 blur-[100px] pointer-events-none" />

      <div className="glass-panel w-full max-w-md relative z-10 mx-4 shadow-2xl transition-transform duration-500 ease-out hover:scale-[1.01]">
        {sent ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center text-center" style={{ gap: "1.25rem" }}>
            {/* Animated check icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#0D0D10] border border-s2 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="var(--lime)" strokeWidth="1.5" opacity="0.35" />
                <path d="M8 12l3 3 5-5" stroke="var(--lime)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div>
              <h1 className="font-outfit text-2xl font-extrabold text-t1 tracking-tighter" style={{ marginBottom: "0.4rem" }}>
                Check your inbox
              </h1>
              <p className="text-t2 text-sm leading-relaxed">
                If <span className="text-t1 font-semibold">{email}</span> is linked to an Evolve account, you'll receive a reset link shortly.
              </p>
            </div>

            <div className="w-full rounded-xl border border-border bg-s2 p-4">
              <p className="text-[0.78rem] text-t2 leading-relaxed">
                The link expires in <span className="text-lime font-semibold">1 hour</span>. Check your spam folder if you don't see it.
              </p>
            </div>

            <div className="flex flex-col w-full gap-3" style={{ marginTop: "0.5rem" }}>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full h-[44px] rounded-[9px] text-sm font-semibold text-t2 border border-border bg-s2 hover:border-purple hover:text-t1 transition-all"
              >
                Try a different email
              </button>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 w-full h-[44px] rounded-[9px] text-sm font-semibold text-purple hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          /* ── Request form ── */
          <>
            <div className="flex justify-center" style={{ marginBottom: "1.75rem" }}>
              <div className="w-14 h-14 bg-[#0D0D10] text-lime rounded-2xl flex items-center justify-center p-3 shadow-inner border border-s2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>

            <h1
              className="font-outfit text-3xl font-extrabold text-t1 tracking-tighter text-center"
              style={{ marginBottom: "0.5rem" }}
            >
              Forgot password?
            </h1>
            <p className="text-t2 text-sm text-center" style={{ marginBottom: "2rem" }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label
                  className="block text-[0.7rem] font-bold text-t2 uppercase tracking-wider"
                  style={{ marginBottom: "0.375rem" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field w-full h-[46px] pl-9 pr-4 placeholder:text-t3 focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="auth-btn-primary w-full h-[46px] text-[0.95rem] tracking-wide shadow-[0_4px_24px_rgba(200,255,77,0.15)] hover:shadow-[0_6px_30px_rgba(200,255,77,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_24px_rgba(200,255,77,0.15)]"
                style={{ marginTop: "0.5rem" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:translate-x-1">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[0.85rem] text-t2 font-medium" style={{ marginTop: "2rem" }}>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-1.5 text-purple hover:text-white transition-colors font-semibold"
              >
                <ArrowLeft size={13} />
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
