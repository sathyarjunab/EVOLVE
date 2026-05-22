"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import getProfile from "../serverAction/getUser";

type Access = {
  habit_tracker: boolean;
  budget_tracker: boolean;
};

export default function RedirectorPage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const res = await getProfile();

        if (!res.success || !res.data) {
          router.push("/landing");
          return;
        }

        const user = res.data;
        const access = user.access as Access;

        let target = "/landing";

        if (access.habit_tracker && access.budget_tracker) {
          target = "/combined-tracker";
        } else if (access.habit_tracker) {
          target = "/habitTracker";
        } else if (access.budget_tracker) {
          target = "/budget-tracker";
        }

        router.push(target);
      } catch (error) {
        console.error("Redirect error:", error);
        router.push("/landing");
      }
    };

    redirect();
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        color: "#fff",
        fontFamily:
          "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Animated background dots */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "2px",
              height: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              borderRadius: "50%",
              animation: `float ${3 + i * 0.5}s infinite`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        {/* Animated loading spinner */}
        <div
          style={{
            width: "60px",
            height: "60px",
            margin: "0 auto 32px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              border: "3px solid rgba(255, 255, 255, 0.1)",
              borderTopColor: "#90C840",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "35px",
              height: "35px",
              border: "2px solid rgba(144, 200, 64, 0.3)",
              borderTopColor: "#90C840",
              borderRadius: "50%",
              animation: "spin 2s linear infinite reverse",
            }}
          />
        </div>

        {/* Text */}
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            margin: "0 0 16px 0",
            letterSpacing: "-0.5px",
          }}
        >
          Redirecting...
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.7)",
            margin: "0 0 8px 0",
            fontWeight: "500",
          }}
        >
          Buckle up, something awesome is coming your way! ✨
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.5)",
            margin: 0,
          }}
        >
          Checking your access and loading your dashboard...
        </p>
      </div>

      {/* Floating icons */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "24px",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "24px",
            animation: "bounce 2s infinite",
            animationDelay: "0s",
          }}
        >
          📊
        </div>
        <div
          style={{
            fontSize: "24px",
            animation: "bounce 2s infinite",
            animationDelay: "0.3s",
          }}
        >
          🎯
        </div>
        <div
          style={{
            fontSize: "24px",
            animation: "bounce 2s infinite",
            animationDelay: "0.6s",
          }}
        >
          🚀
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
