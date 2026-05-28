import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ResetPasswordForm from "./ResetPasswordForm";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const resolvedToken = Array.isArray(token) ? token[0] : token;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime opacity-10 blur-[100px] pointer-events-none" />

      <div className="glass-panel w-full max-w-md relative z-10 mx-4 shadow-2xl transition-transform duration-500 ease-out hover:scale-[1.01]">
        {!resolvedToken ? (
          /* ── No token in URL ── */
          <div
            className="flex flex-col items-center text-center"
            style={{ gap: "1.25rem" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0D0D10] border border-s2 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <path
                  d="M9 9l6 6M15 9l-6 6"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h1
                className="font-outfit text-2xl font-extrabold text-t1 tracking-tighter"
                style={{ marginBottom: "0.4rem" }}
              >
                Invalid reset link
              </h1>
              <p className="text-t2 text-sm leading-relaxed">
                This link is missing a reset token. Please request a new
                password reset.
              </p>
            </div>

            <Link
              href="/auth/forgot-password"
              className="flex items-center justify-center gap-2 w-full h-[44px] rounded-[9px] text-sm font-semibold auth-btn-primary shadow-[0_4px_24px_rgba(200,255,77,0.15)] hover:shadow-[0_6px_30px_rgba(200,255,77,0.3)] hover:-translate-y-0.5 transition-all"
              style={{ marginTop: "0.5rem" }}
            >
              Request new link
            </Link>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-1.5 text-sm text-purple hover:text-white transition-colors font-semibold"
            >
              <ArrowLeft size={13} />
              Back to login
            </Link>
          </div>
        ) : (
          /* ── Reset form ── */
          <ResetPasswordForm token={resolvedToken} />
        )}
      </div>
    </div>
  );
}
