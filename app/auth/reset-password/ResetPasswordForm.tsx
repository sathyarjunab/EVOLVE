"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordSchema } from "@/util/validator";
import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetPasswordSchema) {
    try {
      const res = await fetch("/api/resetPassword", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (success) {
    return (
      <div
        className="flex flex-col items-center text-center"
        style={{ gap: "1.25rem" }}
      >
        {/* Success icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#0D0D10] border border-s2 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="var(--lime)"
              strokeWidth="1.5"
              opacity="0.35"
            />
            <path
              d="M8 12l3 3 5-5"
              stroke="var(--lime)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h1
            className="font-outfit text-2xl font-extrabold text-t1 tracking-tighter"
            style={{ marginBottom: "0.4rem" }}
          >
            Password updated
          </h1>
          <p className="text-t2 text-sm leading-relaxed">
            Your password has been reset successfully. You can now sign in with
            your new password.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 w-full h-[44px] rounded-[9px] text-sm font-semibold auth-btn-primary shadow-[0_4px_24px_rgba(200,255,77,0.15)] hover:shadow-[0_6px_30px_rgba(200,255,77,0.3)] hover:-translate-y-0.5 transition-all"
          style={{ marginTop: "0.5rem" }}
        >
          Go to Login
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Icon */}
      <div className="flex justify-center" style={{ marginBottom: "1.75rem" }}>
        <div className="w-14 h-14 bg-[#0D0D10] text-lime rounded-2xl flex items-center justify-center p-3 shadow-inner border border-s2">
          <ShieldCheck size={24} />
        </div>
      </div>

      <h1
        className="font-outfit text-3xl font-extrabold text-t1 tracking-tighter text-center"
        style={{ marginBottom: "0.5rem" }}
      >
        Set new password
      </h1>
      <p
        className="text-t2 text-sm text-center"
        style={{ marginBottom: "2rem" }}
      >
        Choose a strong password for your Evolve account.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        {/* New password */}
        <div>
          <label
            className="block text-[0.7rem] font-bold text-t2 uppercase tracking-wider"
            style={{ marginBottom: "0.375rem" }}
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="input-field w-full h-[46px] px-4 pr-10 placeholder:text-t3 focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all"
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-t2 hover:text-t1 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p
              className="text-[0.7rem] text-red-500"
              style={{ marginTop: "0.25rem" }}
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            className="block text-[0.7rem] font-bold text-t2 uppercase tracking-wider"
            style={{ marginBottom: "0.375rem" }}
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="input-field w-full h-[46px] px-4 pr-10 placeholder:text-t3 focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-t2 hover:text-t1 transition-colors"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              className="text-[0.7rem] text-red-500"
              style={{ marginTop: "0.25rem" }}
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-btn-primary w-full h-[46px] text-[0.95rem] tracking-wide shadow-[0_4px_24px_rgba(200,255,77,0.15)] hover:shadow-[0_6px_30px_rgba(200,255,77,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_24px_rgba(200,255,77,0.15)]"
          style={{ marginTop: "0.5rem" }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Updating…
            </>
          ) : (
            <>
              Reset Password
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>
      </form>

      <p
        className="text-center text-[0.85rem] text-t2 font-medium"
        style={{ marginTop: "2rem" }}
      >
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-1.5 text-purple hover:text-white transition-colors font-semibold"
        >
          <ArrowLeft size={13} />
          Back to login
        </Link>
      </p>
    </>
  );
}
