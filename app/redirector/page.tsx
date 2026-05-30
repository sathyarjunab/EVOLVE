"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import getProfile from "../serverAction/getUser";

type Access = {
  habit_tracker: boolean;
  money_tracker: boolean;
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

        if (access.habit_tracker && access.money_tracker) {
          target = "/combined-tracker";
        } else if (access.habit_tracker) {
          target = "/habitTracker";
        } else if (access.money_tracker) {
          target = "/money-tracker";
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
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1B1B1F",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* Purple blob — top right */}
      <div
        style={{
          position: "absolute",
          top: "-5%",
          right: "-10%",
          width: "40%",
          height: "40%",
          borderRadius: "50%",
          background: "#7B6EF5",
          opacity: 0.2,
          filter: "blur(130px)",
          pointerEvents: "none",
        }}
      />
      {/* Lime blob — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: "50%",
          height: "50%",
          borderRadius: "50%",
          background: "#C8FF4D",
          opacity: 0.1,
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <img
          src="/evolve-logo.svg"
          alt="Evolve"
          style={{ height: "48px", width: "auto", marginBottom: "2rem" }}
        />

        {/* Spinner */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "3px solid rgba(200,255,77,0.15)",
            borderTopColor: "#C8FF4D",
            animation: "spin 0.8s linear infinite",
            marginBottom: "1.75rem",
          }}
        />

        {/* Text */}
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
            margin: "0 0 0.5rem 0",
          }}
        >
          Just a moment
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#9898A5",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Loading your dashboard…
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
