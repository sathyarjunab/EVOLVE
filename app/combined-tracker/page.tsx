"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import "./combinedflow.css";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "../AuthContextProvider";
import { useRouter } from "next/navigation";

const w =
  (fn: string, ...args: unknown[]) =>
  () =>
    (window as any)[fn]?.(...args);

const YEARS = ["2024", "2025", "2026", "2027", "2028"];

export default function CombinedTrackerPage() {
  const { logout, user, loading } = useAuth();
  const router = useRouter();
  const [dbData, setDbData] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/landing");
      } else {
        const access = ((user as any).access ?? {}) as {
          habit_tracker?: boolean;
          money_tracker?: boolean;
        };
        if (!access.habit_tracker && !access.money_tracker) {
          // No products at all
          router.push("/landing");
        } else if (access.habit_tracker && !access.money_tracker) {
          // Only has habit tracker
          router.push("/habitTracker");
        } else if (!access.habit_tracker && access.money_tracker) {
          // Only has money tracker
          router.push("/money-tracker");
        }
        // Both true → stay on combined-tracker ✓
      }
    }
  }, [loading, user]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
  }

  useEffect(() => {
    (window as any).showToast = (msg: string) => {
      toast.error(msg);
    };

    fetch("/api/combined/init")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        return data;
      })
      .then((data) => {
        if (data.success) {
          setDbData({ hState: data.hState, bState: data.bState });
        }
      })
      .catch(() => {
        toast.error("Failed to fetch initial state");
      });
  }, []);

  if (!dbData) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
          color: "var(--t2)",
          fontFamily: "Manrope, sans-serif",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Outfit:wght@400;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Chart.js CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"
        strategy="afterInteractive"
      />

      {/* Injected state */}
      <Script
        id="combinedflow-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dbData).replace(/</g, "\\u003c"),
        }}
      />

      {/* Combined-tracker logic */}
      <Script src="/combinedflow-init.js" strategy="afterInteractive" />

      {/* ═══ NAV ═══ */}
      <nav>
        {/* Logo */}
        <div
          style={{
            width: "auto",
            height: "48px",
            background: "transparent",
            borderRadius: 0,
            padding: 0,
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <img
            src="/evolve-logo.svg"
            height={48}
            style={{ display: "block", height: "48px", width: "auto" }}
            alt="Evolve logo"
          />
        </div>

        {/* Mobile hamburger */}
        <button
          className="mob-menu-btn"
          id="mobMenuBtn"
          onClick={w("toggleMobDrawer")}
        >
          <span className="hb-line"></span>
          <span className="hb-line"></span>
          <span className="hb-line"></span>
        </button>

        {/* Nav tabs */}
        <div className="nav-tabs">
          <button
            className="ntab active"
            onClick={w("showPage", "overview")}
            id="tab-overview"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect
                x="1"
                y="1"
                width="4.5"
                height="4.5"
                rx="1.2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="6.5"
                y="1"
                width="4.5"
                height="4.5"
                rx="1.2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="1"
                y="6.5"
                width="4.5"
                height="4.5"
                rx="1.2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="6.5"
                y="6.5"
                width="4.5"
                height="4.5"
                rx="1.2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            Overview
          </button>
          <button
            className="ntab"
            onClick={w("showPage", "budget")}
            id="tab-budget"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M10 4H8a2 2 0 000 4h2V4z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="1"
                y="2"
                width="9"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            Budget
          </button>
          <button
            className="ntab"
            onClick={w("showPage", "habits")}
            id="tab-habits"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 3h8M2 6h6M2 9h4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            Habits
          </button>
          <button
            className="ntab"
            onClick={w("showPage", "ledger")}
            id="tab-ledger"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1.5 9.5L4 7l2.5 2L10.5 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ledger
          </button>
        </div>

        {/* Nav right: currency, month, year, logout, avatar */}
        <div className="nav-right">
          {/* Currency selector */}
          <div className="nav-sel-wrap" id="currencyWrap" title="Currency">
            <span className="nsw-icon">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M6 3v6M4.5 4.5h2a1 1 0 010 2H4.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <select
              className="nav-sel"
              id="navCurrency"
              onChange={w("onCurrencyChange")}
              style={{ minWidth: "68px" }}
            >
              <option value="$">$ USD</option>
              <option value="₹">₹ INR</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
              <option value="¥">¥ JPY</option>
              <option value="A$">A$ AUD</option>
              <option value="C$">C$ CAD</option>
              <option value="Fr">Fr CHF</option>
            </select>
            <span className="nsw-chev">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          {/* Month selector */}
          <div className="nav-sel-wrap">
            <span className="nsw-icon">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <rect
                  x="1"
                  y="1.5"
                  width="10"
                  height="9"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M4 1.5V3M8 1.5V3M1 5h10"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <select
              className="nav-sel"
              id="navMonth"
              onChange={w("onPeriodChange")}
            >
              <option value="0">Jan</option>
              <option value="1">Feb</option>
              <option value="2">Mar</option>
              <option value="3">Apr</option>
              <option value="4">May</option>
              <option value="5">Jun</option>
              <option value="6">Jul</option>
              <option value="7">Aug</option>
              <option value="8">Sep</option>
              <option value="9">Oct</option>
              <option value="10">Nov</option>
              <option value="11">Dec</option>
            </select>
            <span className="nsw-chev">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          {/* Year selector */}
          <div className="nav-sel-wrap">
            <span className="nsw-icon">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M6 3.5v3l1.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <select
              className="nav-sel"
              id="navYear"
              onChange={w("onPeriodChange")}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="nsw-chev">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          {/* Logout */}
          <button
            className="nav-feedback-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: isLoggingOut ? 0.6 : 1,
            }}
          >
            {isLoggingOut ? (
              <Loader2 size={12} strokeWidth={2} className="animate-spin" />
            ) : (
              <LogOut size={12} strokeWidth={2} />
            )}
            <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
          </button>

          <div className="avatar"></div>
        </div>
      </nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      <div
        className="mob-drawer-backdrop"
        id="mobDrawerBackdrop"
        onClick={w("closeMobDrawer")}
      ></div>
      <div className="mob-drawer" id="mobDrawer">
        <div className="mob-drawer-section-lbl">View Period</div>
        <div className="mob-drawer-selectors">
          <div className="nav-sel-wrap" style={{ flex: 1, height: "36px" }}>
            <span className="nsw-icon">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <rect
                  x="1"
                  y="1.5"
                  width="10"
                  height="9"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M4 1.5V3M8 1.5V3M1 5h10"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <select
              className="nav-sel"
              id="mobMonth"
              onChange={w("syncMobPeriod")}
              style={{ minWidth: "100px" }}
            >
              <option value="0">January</option>
              <option value="1">February</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
            <span className="nsw-chev">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
          <div
            className="nav-sel-wrap"
            style={{ flex: "0 0 90px", height: "36px" }}
          >
            <span className="nsw-icon">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M6 3.5v3l1.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <select
              className="nav-sel"
              id="mobYear"
              onChange={w("syncMobPeriod")}
              style={{ minWidth: "74px" }}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="nsw-chev">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="content">
        {/* ════ OVERVIEW PAGE ════ */}
        <div className="page active" id="page-overview">
          {/* Welcome row */}
          <div className="top-row">
            <div className="welcome">
              <div className="welcome-sub">Welcome back,</div>
              <div className="welcome-name" id="wNameOv">
                Your
                <br />
                <span>Flow</span>
              </div>
              <span className="month-badge" id="monthBadge">
                May 2026
              </span>
            </div>
            <div className="stat-cards">
              {/* Spent */}
              <div className="scard red-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 12V6l5-4.5L12 6v6"
                        stroke="var(--red)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="4.5"
                        y="8"
                        width="2"
                        height="4"
                        rx=".5"
                        fill="var(--red)"
                        opacity=".6"
                      />
                      <rect
                        x="7.5"
                        y="6"
                        width="2"
                        height="6"
                        rx=".5"
                        fill="var(--red)"
                      />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Spent</div>
                <div className="scard-val" id="ov-spent">
                  $0
                </div>
                <div className="scard-delta" id="ov-spent-sub">
                  of $0 income
                </div>
              </div>
              {/* Saved */}
              <div className="scard lime-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 12V2M3.5 9.5l3.5 2.5L10.5 9.5"
                        stroke="var(--lime)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Saved</div>
                <div className="scard-val" id="ov-saved">
                  $0
                </div>
                <div className="scard-delta" id="ov-saved-sub">
                  this month
                </div>
              </div>
              {/* Streak */}
              <div className="scard">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1.5l1.2 3.7H12l-3 2.2 1.1 3.6L7 8.8l-3.1 2.2 1.1-3.6-3-2.2h3.8Z"
                        stroke="var(--t2)"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Streak</div>
                <div className="scard-val" id="ov-streak">
                  0
                  <span
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 500,
                      color: "var(--t2)",
                      marginLeft: "3px",
                    }}
                  >
                    days
                  </span>
                </div>
                <div className="scard-delta" id="ov-streak-sub">
                  best: 0 days
                </div>
              </div>
              {/* Today's Rate */}
              <div className="scard lime">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <rect
                        x="2"
                        y="2"
                        width="10"
                        height="10"
                        rx="2"
                        stroke="rgba(0,0,0,.5)"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M5 7l2 2 3-3"
                        stroke="rgba(0,0,0,.5)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Today&#39;s Rate</div>
                <div className="scard-val" id="ov-hrate">
                  0%
                </div>
                <div className="scard-delta" id="ov-hrate-sub">
                  0 of 0 done
                </div>
              </div>
            </div>
          </div>

          {/* Budget progress bar */}
          <div className="bbar-wrap" id="ov-bbar">
            <div className="bbar-top">
              <span className="bbar-title">Monthly Budget</span>
              <span
                className="bbar-pct"
                id="ov-bbarPct"
                style={{ color: "var(--lime)" }}
              >
                0%
              </span>
            </div>
            <div className="bbar-bg">
              <div
                className="bbar-fill"
                id="ov-bbarFill"
                style={{ width: "0%", background: "var(--lime)" }}
              ></div>
            </div>
            <div className="bbar-labels">
              <span id="ov-bbarSpent">$0 spent</span>
              <span id="ov-bbarIncome">of $0 total income</span>
            </div>
          </div>

          {/* Overview panels: donut + habits + savings */}
          <div className="panels-row" style={{ minHeight: "280px" }}>
            {/* Spending donut */}
            <div className="panel chart-panel" id="ov-donut-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <circle
                      cx="7"
                      cy="7"
                      r="5.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      opacity=".5"
                    />
                    <path
                      d="M7 7V2.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Spending Breakdown
                </div>
              </div>
              <div id="donutWrap">
                <canvas
                  id="donutChart"
                  style={{ maxWidth: "148px", maxHeight: "148px" }}
                ></canvas>
                <div className="donut-center">
                  <div className="donut-center-val" id="donutCenterVal">
                    $0
                  </div>
                  <div className="donut-center-lbl">total spent</div>
                </div>
              </div>
              <div className="donut-legend" id="donutLegend"></div>
            </div>

            {/* Today's Habits mini */}
            <div
              className="panel"
              style={{ flex: 1, minWidth: "220px" }}
              id="ov-habits-panel"
            >
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 4h8M3 7h6M3 10h4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      opacity=".6"
                    />
                  </svg>
                  Today&#39;s Habits
                </div>
                <button
                  className="p-btn"
                  onClick={w("showPage", "habits")}
                  title="Go to Habits"
                >
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M2 5.5h7M6 3l2.5 2.5L6 8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div
                className="habits-list"
                id="ovHabitsList"
                style={{ maxHeight: "200px" }}
              ></div>
              <div
                id="ovHabitsEmpty"
                style={{
                  fontSize: ".72rem",
                  color: "var(--t3)",
                  textAlign: "center",
                  padding: "16px 0",
                  display: "none",
                }}
              >
                Add habits in the Habits tab →
              </div>
            </div>

            {/* Savings mini */}
            <div
              className="panel"
              style={{ width: "220px", flexShrink: 0 }}
              id="ov-savings-panel"
            >
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <circle
                      cx="7"
                      cy="7"
                      r="5.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <circle
                      cx="7"
                      cy="7"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <circle cx="7" cy="7" r=".8" fill="currentColor" />
                  </svg>
                  Savings Goals
                </div>
                <button
                  className="p-btn"
                  onClick={w("showPage", "budget")}
                  title="See all goals"
                >
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M2 5.5h7M6 3l2.5 2.5L6 8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  flex: 1,
                  overflowY: "auto",
                }}
                id="ovGoalsMini"
              ></div>
              <div
                id="ovGoalsEmpty"
                style={{
                  fontSize: ".72rem",
                  color: "var(--t3)",
                  textAlign: "center",
                  padding: "16px 0",
                  display: "none",
                }}
              >
                Add goals in the Budget tab →
              </div>
            </div>
          </div>

          {/* Habit Trend chart */}
          <div className="ov-trend-panel">
            <div className="ov-trend-head">
              <div className="ov-trend-title">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1.5 11L5 7.5l2.5 2L12.5 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Habit Completion Trend
              </div>
              <div className="ov-trend-toggle">
                <button
                  className="ov-ttgl active"
                  data-trend="month"
                  onClick={w("switchTrend", "month")}
                >
                  Month
                </button>
                <button
                  className="ov-ttgl"
                  data-trend="year"
                  onClick={w("switchTrend", "year")}
                >
                  Year
                </button>
              </div>
            </div>
            <div id="ovTrendWrap">
              <canvas id="ovTrendCanvas"></canvas>
              <div
                className="ov-trend-empty"
                id="ovTrendEmpty"
                style={{ display: "none" }}
              >
                Track habits to see your trend
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="panel recent-panel">
            <div className="panel-head">
              <div className="panel-title">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1.5 10.5L5 7l3 2.5L12.5 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Recent Transactions
              </div>
              <button
                style={{
                  fontSize: ".7rem",
                  padding: "4px 11px",
                  background: "var(--s2)",
                  color: "var(--t2)",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Manrope',sans-serif",
                  fontWeight: 600,
                }}
                onClick={w("showPage", "ledger")}
              >
                View all →
              </button>
            </div>
            <div className="tx-list" id="recentList"></div>
          </div>
        </div>

        {/* ════ BUDGET PAGE ════ */}
        <div className="page" id="page-budget">
          <div className="top-row">
            <div className="welcome">
              <div className="welcome-sub">Budget for</div>
              <div className="welcome-name" id="wNameBudget">
                Your
                <br />
                <span>Budget</span>
              </div>
              <span className="month-badge" id="monthBadgeBudget">
                May 2026
              </span>
            </div>
            <div className="stat-cards">
              <div className="scard red-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 12V6l5-4.5L12 6v6"
                        stroke="var(--red)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="4.5"
                        y="8"
                        width="2"
                        height="4"
                        rx=".5"
                        fill="var(--red)"
                        opacity=".6"
                      />
                      <rect
                        x="7.5"
                        y="6"
                        width="2"
                        height="6"
                        rx=".5"
                        fill="var(--red)"
                      />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Spent</div>
                <div className="scard-val" id="sv-spent">
                  $0
                </div>
                <div className="scard-delta" id="sd-spent">
                  of $0 income
                </div>
              </div>
              <div className="scard lime-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 12V2M3.5 9.5l3.5 2.5L10.5 9.5"
                        stroke="var(--lime)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Saved</div>
                <div className="scard-val" id="sv-saved">
                  $0
                </div>
                <div className="scard-delta" id="sd-saved">
                  this month
                </div>
              </div>
              <div className="scard amb-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <rect
                        x="1.5"
                        y="2.5"
                        width="11"
                        height="9"
                        rx="2"
                        stroke="var(--amber)"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M4.5 1.5V3M9.5 1.5V3M1.5 5.5h11"
                        stroke="var(--amber)"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                      <circle cx="9.5" cy="8.5" r="1" fill="var(--amber)" />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Due This Week</div>
                <div className="scard-val" id="sv-week">
                  $0
                </div>
                <div className="scard-delta" id="sd-week">
                  0 bills
                </div>
              </div>
              <div className="scard grn-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 12.5V1.5M3.5 9.5l3.5 2.5 3.5-2.5"
                        stroke="var(--grn)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="scard-label">Total Income</div>
                <div className="scard-val" id="sv-income">
                  $0
                </div>
                <div className="scard-delta" id="sd-income">
                  0 sources
                </div>
              </div>
            </div>
          </div>

          <div className="bbar-wrap">
            <div className="bbar-top">
              <span className="bbar-title">Monthly Budget</span>
              <span
                className="bbar-pct"
                id="bbarPct"
                style={{ color: "var(--lime)" }}
              >
                0%
              </span>
            </div>
            <div className="bbar-bg">
              <div
                className="bbar-fill"
                id="bbarFill"
                style={{ width: "0%", background: "var(--lime)" }}
              ></div>
            </div>
            <div className="bbar-labels">
              <span id="bbarSpentLbl">$0 spent</span>
              <span id="bbarIncomeLbl">of $0 total income</span>
            </div>
          </div>

          <div className="panels-row" style={{ minHeight: "280px" }}>
            {/* Spending donut 2 */}
            <div className="panel chart-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <circle
                      cx="7"
                      cy="7"
                      r="5.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      opacity=".5"
                    />
                    <path
                      d="M7 7V2.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7 7l3.5 3"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      opacity=".6"
                    />
                  </svg>
                  Spending Breakdown
                </div>
              </div>
              <div id="donutWrap2">
                <canvas
                  id="donutChart2"
                  style={{ maxWidth: "148px", maxHeight: "148px" }}
                ></canvas>
                <div className="donut-center">
                  <div className="donut-center-val" id="donutCenterVal2">
                    $0
                  </div>
                  <div className="donut-center-lbl">total spent</div>
                </div>
              </div>
              <div className="donut-legend" id="donutLegend2"></div>
            </div>

            {/* Money Flow */}
            <div className="panel flow-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <rect
                      x="2"
                      y="7"
                      width="2.5"
                      height="5"
                      rx="1"
                      fill="currentColor"
                      opacity=".4"
                    />
                    <rect
                      x="5.75"
                      y="4"
                      width="2.5"
                      height="8"
                      rx="1"
                      fill="currentColor"
                      opacity=".6"
                    />
                    <rect
                      x="9.5"
                      y="2"
                      width="2.5"
                      height="10"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                  Money Flow
                </div>
              </div>
              <div className="flow-bar-wrap" id="flowBars">
                <div
                  style={{
                    fontSize: ".7rem",
                    color: "var(--t3)",
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No expenses yet
                </div>
              </div>
            </div>

            {/* Income Sources */}
            <div className="panel income-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <circle
                      cx="7"
                      cy="5"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Income Sources
                </div>
                <button
                  className="p-btn"
                  onClick={w("openIncomeModal")}
                  title="Add income source"
                >
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M5.5 1.5v8M1.5 5.5h8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="income-total-bar">
                <span className="income-total-lbl">↑ This Month</span>
                <span className="income-total-val" id="incomeTotalVal">
                  $0
                </span>
              </div>
              <div className="src-list" id="srcList">
                <div
                  style={{
                    fontSize: ".7rem",
                    color: "var(--t3)",
                    textAlign: "center",
                    padding: "14px 0",
                  }}
                >
                  Add your income sources
                </div>
              </div>
            </div>

            {/* Fixed Dues */}
            <div className="panel dues-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6v3l-1 1.5h11L11.5 9V6c0-2.5-2-4.5-4.5-4.5Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M5.5 12a1.5 1.5 0 003 0"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                  </svg>
                  Fixed Dues
                </div>
                <button
                  className="p-btn"
                  onClick={w("openDueModal")}
                  title="Add due"
                >
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M5.5 1.5v8M1.5 5.5h8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="due-list" id="dueList">
                <div
                  style={{
                    fontSize: ".7rem",
                    color: "var(--t3)",
                    textAlign: "center",
                    padding: "14px 0",
                  }}
                >
                  No fixed dues yet
                </div>
              </div>
            </div>
          </div>

          {/* Recent transactions 2 */}
          <div className="panel recent-panel">
            <div className="panel-head">
              <div className="panel-title">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1.5 10.5L5 7l3 2.5L12.5 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Recent Transactions
              </div>
              <button
                style={{
                  fontSize: ".7rem",
                  padding: "4px 11px",
                  background: "var(--s2)",
                  color: "var(--t2)",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Manrope',sans-serif",
                  fontWeight: 600,
                }}
                onClick={w("showPage", "ledger")}
              >
                View all →
              </button>
            </div>
            <div className="tx-list" id="recentList2"></div>
          </div>

          {/* Savings Section */}
          <div className="section-divider">
            <div className="section-divider-line"></div>
            <span className="section-divider-lbl">💰 Savings</span>
            <div className="section-divider-line"></div>
          </div>
          <div className="savings-section">
            <div className="sv-summary-row">
              <div className="sv-mini">
                <div className="sv-mini-lbl">Leftover This Month</div>
                <div
                  className="sv-mini-val"
                  id="svLeftover"
                  style={{ color: "var(--lime)" }}
                >
                  0
                </div>
                <div
                  className="sv-rate-pill"
                  id="scRatePill"
                  style={{ display: "inline-block" }}
                >
                  0% savings rate
                </div>
              </div>
              <div className="sv-mini">
                <div className="sv-mini-lbl">Allocated to Goals</div>
                <div
                  className="sv-mini-val"
                  id="svAllocated"
                  style={{ color: "var(--purple)" }}
                >
                  0
                </div>
                <div className="sv-mini-sub">counted in your spending</div>
              </div>
            </div>
            <span id="scInc" style={{ display: "none" }}></span>
            <span id="scExp" style={{ display: "none" }}></span>
            <span id="scSaved" style={{ display: "none" }}></span>
            <div className="savings-section-head">
              <div className="savings-section-title">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="5.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx="7"
                    cy="7"
                    r="2.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle cx="7" cy="7" r=".8" fill="currentColor" />
                </svg>
                Savings Goals
              </div>
              <button
                className="p-btn"
                onClick={w("openGoalModal")}
                title="Add goal"
                style={{ width: "28px", height: "28px" }}
              >
                <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M5.5 1.5v8M1.5 5.5h8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="goals-grid" id="goalList"></div>
          </div>
        </div>

        {/* ════ HABITS PAGE ════ */}
        <div className="page" id="page-habits">
          <div className="top-row">
            <div className="welcome">
              <div className="welcome-sub">Habits for</div>
              <div className="welcome-name" id="wNameHabits">
                Your
                <br />
                <span>Habits</span>
              </div>
              <span className="badge-prem">Tracker</span>
            </div>
            <div className="stat-cards">
              <div className="scard">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <circle
                        cx="7"
                        cy="5"
                        r="2.5"
                        stroke="var(--t2)"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5"
                        stroke="var(--t2)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <button className="sarrow" onClick={w("showPage", "habits")}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                        stroke="#111"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="scard-label">Total Completed</div>
                <div className="scard-val" id="sv1">
                  —
                </div>
                <div className="scard-delta" id="sd1">
                  <span className="delta-pos">all time</span>
                </div>
              </div>
              <div className="scard">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1.5l1.2 3.7H12l-3 2.2 1.1 3.6L7 8.8l-3.1 2.2 1.1-3.6-3-2.2h3.8Z"
                        stroke="var(--t2)"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <button className="sarrow" onClick={w("showPage", "habits")}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                        stroke="#111"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="scard-label">Current Streak</div>
                <div
                  className="scard-val"
                  id="sv2"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "3px",
                  }}
                >
                  —
                  <span
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 500,
                      color: "var(--t2)",
                    }}
                    id="sv2sub"
                  >
                    days
                  </span>
                </div>
                <div className="scard-delta" id="sd2">
                  Best: <span id="bestStreakVal">—</span> days
                </div>
              </div>
              <div className="scard lime">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <rect
                        x="2"
                        y="2"
                        width="10"
                        height="10"
                        rx="2"
                        stroke="rgba(0,0,0,.5)"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M5 7l2 2 3-3"
                        stroke="rgba(0,0,0,.5)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <button className="sarrow" onClick={w("showPage", "habits")}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                        stroke="#111"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="scard-label">Today&#39;s Rate</div>
                <div className="scard-val" id="sv3">
                  0%
                </div>
                <div className="scard-delta" id="sd3">
                  0 of 0 done
                </div>
                <span id="analyticsCount" style={{ display: "none" }}>
                  0
                </span>
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-tabs">
              <button className="ftab active" data-filter="all">
                All
              </button>
              <button className="ftab" data-filter="morning">
                Morning
              </button>
              <button className="ftab" data-filter="evening">
                Evening
              </button>
              <button className="ftab" data-filter="anytime">
                Anytime
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button className="dl-btn" onClick={w("exportHabitData")}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1.5v6M3.5 5.5l2.5 3 2.5-3M2 10h8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export
              </button>
            </div>
          </div>

          <div className="panels-row">
            {/* Today's Habits panel */}
            <div className="panel panel-habits-tall">
              <div className="panel-head">
                <div className="panel-title" id="habitsPanelTitle">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 4h8M3 7h6M3 10h4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      opacity=".6"
                    />
                  </svg>
                  Today&#39;s Habits
                </div>
                <button
                  className="p-btn"
                  onClick={w("openHabitModal")}
                  title="Add habit"
                >
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M5.5 1.5v8M1.5 5.5h8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="search-wrap">
                <svg viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="6"
                    cy="6"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M9 9l2.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  className="search-inp"
                  id="searchInp"
                  type="text"
                  placeholder="Search habits…"
                  onInput={w("renderHabits")}
                />
              </div>
              <div className="habits-list" id="habitsList"></div>
            </div>

            {/* Right column */}
            <div className="panels-right">
              <div className="panels-top">
                {/* Bar chart */}
                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="7"
                          width="2.5"
                          height="5"
                          rx="1"
                          fill="currentColor"
                          opacity=".4"
                        />
                        <rect
                          x="5.75"
                          y="4"
                          width="2.5"
                          height="8"
                          rx="1"
                          fill="currentColor"
                          opacity=".6"
                        />
                        <rect
                          x="9.5"
                          y="2"
                          width="2.5"
                          height="10"
                          rx="1"
                          fill="currentColor"
                        />
                      </svg>
                      Habit Completion
                    </div>
                    <div className="panel-controls">
                      <div className="toggle-group">
                        <button
                          className="tgl"
                          data-period="monthly"
                          onClick={w("setPeriod", "monthly")}
                        >
                          Monthly
                        </button>
                        <button
                          className="tgl active"
                          data-period="annually"
                          onClick={w("setPeriod", "annually")}
                        >
                          Annually
                        </button>
                      </div>
                      <button className="dots-btn">···</button>
                    </div>
                  </div>
                  <div id="habitChartWrap">
                    <canvas id="barChart"></canvas>
                    <div className="chart-tooltip" id="chartTip">
                      <div className="ct-month" id="tipLabel">
                        Apr 2025
                      </div>
                      <div className="ct-val" id="tipVal">
                        80%
                      </div>
                      <div className="ct-badge" id="tipBadge">
                        +12%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Map / Heatmap */}
                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <circle
                          cx="7"
                          cy="7"
                          r="5.5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          opacity=".5"
                        />
                        <path
                          d="M7 3.5v4l2.5 1.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                      Activity Map
                    </div>
                    <div className="panel-controls">
                      <button className="dots-btn">···</button>
                    </div>
                  </div>
                  <div className="hm-legend">
                    <span style={{ fontSize: ".58rem", color: "var(--t3)" }}>
                      Less
                    </span>
                    <div
                      className="hm-sq"
                      style={{ background: "#2A2A32" }}
                    ></div>
                    <div
                      className="hm-sq"
                      style={{ background: "#2D4A1A" }}
                    ></div>
                    <div
                      className="hm-sq"
                      style={{ background: "#3A5E1E" }}
                    ></div>
                    <div
                      className="hm-sq"
                      style={{ background: "#5A8E2E" }}
                    ></div>
                    <div
                      className="hm-sq"
                      style={{ background: "#90C840" }}
                    ></div>
                    <div
                      className="hm-sq"
                      style={{ background: "#C8FF4D" }}
                    ></div>
                    <span style={{ fontSize: ".58rem", color: "var(--t3)" }}>
                      More
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      gap: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="hm-labels-x"
                      id="hmLabX"
                      style={{ gridTemplateColumns: "26px repeat(7,1fr)" }}
                    ></div>
                    <div id="hmBody" className="hm-body"></div>
                  </div>
                </div>
              </div>

              {/* Daily Progress line chart */}
              <div className="line-panel">
                <div className="panel-head" style={{ marginBottom: "8px" }}>
                  <div className="panel-title">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1.5 10.5L5 7l3 2.5L12.5 4"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Daily Progress
                  </div>
                  <div className="panel-controls">
                    <div className="toggle-group">
                      <button
                        className="tgl active"
                        data-lv="month"
                        onClick={w("setLineView", "month")}
                      >
                        Month
                      </button>
                      <button
                        className="tgl"
                        data-lv="year"
                        onClick={w("setLineView", "year")}
                      >
                        Year
                      </button>
                    </div>
                    <span
                      id="lineViewLabel"
                      style={{
                        fontSize: ".68rem",
                        color: "var(--t3)",
                        whiteSpace: "nowrap",
                      }}
                    ></span>
                  </div>
                </div>
                <div className="line-wrap">
                  <canvas id="lineChart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════ LEDGER PAGE ════ */}
        <div className="page" id="page-ledger">
          <div className="ledger-controls">
            <div className="search-wrap" style={{ flex: 1, minWidth: "140px" }}>
              <svg viewBox="0 0 14 14" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M9 9l2.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                className="search-inp"
                id="ledgerSearch"
                type="text"
                placeholder="Search transactions…"
                onInput={w("renderLedger")}
              />
            </div>
            <button
              className="fpill active"
              data-lf="all"
              onClick={w("setLedgerFilter", "all")}
            >
              All
            </button>
            <button
              className="fpill"
              data-lf="income"
              onClick={w("setLedgerFilter", "income")}
            >
              Income
            </button>
            <button
              className="fpill"
              data-lf="expense"
              onClick={w("setLedgerFilter", "expense")}
            >
              Expenses
            </button>
            <button className="dl-btn" onClick={w("exportCSV")}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1.5v6M3.5 5.5l2.5 3 2.5-3M2 10h8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export CSV
            </button>
          </div>
          <div className="panel ledger-panel">
            <div className="tx-list" id="ledgerList"></div>
          </div>
        </div>
      </div>
      {/* /content */}

      {/* ═══ FAB (desktop) ═══ */}
      <button
        className="fab"
        id="fabBtn"
        onClick={w("openTxModal")}
        title="Add transaction"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="mob-nav-outer">
        <div className="mob-nav">
          <button
            className="mob-nav-item active"
            id="mob-tab-overview"
            onClick={w("showPage", "overview")}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="2" y="2" width="7" height="7" rx="1.5" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" />
            </svg>
            <span>Overview</span>
          </button>
          <button
            className="mob-nav-item"
            id="mob-tab-budget"
            onClick={w("showPage", "budget")}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M16 8H14a3 3 0 000 6h2V8z" />
              <rect x="2" y="4" width="14" height="12" rx="2" />
            </svg>
            <span>Budget</span>
          </button>
          <div className="mob-fab-outer">
            <button className="mob-fab" onClick={w("openTxModal")}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 7v14M7 14h14"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className="mob-fab-lbl">Add</span>
          </div>
          <button
            className="mob-nav-item"
            id="mob-tab-habits"
            onClick={w("showPage", "habits")}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M4 6h12M4 10h9M4 14h6" />
            </svg>
            <span>Habits</span>
          </button>
          <button
            className="mob-nav-item"
            id="mob-tab-ledger"
            onClick={w("showPage", "ledger")}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M3 10.5L7 6.5l4 3.5L17 5" />
            </svg>
            <span>Ledger</span>
          </button>
        </div>
      </div>

      {/* ═══ ADD TRANSACTION MODAL ═══ */}
      <div
        className="m-overlay"
        id="txOverlay"
        onClick={(e) =>
          (window as any).overlayClose?.(e.nativeEvent, "txOverlay")
        }
      >
        <div className="m-card">
          <div className="m-title">
            <span id="txModalTitle">Add Transaction</span>
            <button className="m-close" onClick={w("closeModal", "txOverlay")}>
              ✕
            </button>
          </div>
          <div className="m-type-row">
            <button
              className="m-type-btn sel-expense"
              id="typeExpense"
              onClick={w("setTxType", "expense")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 10.5V1.5M3 8.5l3 2 3-2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Expense
            </button>
            <button
              className="m-type-btn"
              id="typeIncome"
              onClick={w("setTxType", "income")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1.5v9M3 3.5l3-2 3 2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Income
            </button>
            <button
              className="m-type-btn"
              id="typeSavings"
              onClick={w("setTxType", "savings")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <circle
                  cx="6"
                  cy="6"
                  r="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
              Savings
            </button>
          </div>
          <div
            id="savingsGoalRow"
            className="m-group"
            style={{ display: "none" }}
          >
            <label className="m-label">
              Allocate to Goal{" "}
              <span style={{ color: "var(--t3)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <select className="m-select" id="txGoalSel">
              <option value="">General savings</option>
            </select>
            <div className="savalloc-hint" id="savAllocHint"></div>
          </div>
          <div className="m-row">
            <div className="m-group">
              <label className="m-label" id="txNameLabel">
                Description
              </label>
              <input
                className="m-input"
                id="txName"
                type="text"
                placeholder="e.g. Groceries, Freelance…"
                maxLength={50}
              />
            </div>
            <div className="m-group" style={{ maxWidth: "115px" }}>
              <label className="m-label">Amount</label>
              <input
                className="m-input"
                id="txAmt"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>
          <div className="m-row">
            <div className="m-group" id="txCatGroup">
              <label className="m-label">Category</label>
              <select className="m-select" id="txCat">
                <option value="Food & Dining">🍽️ Food &amp; Dining</option>
                <option value="Rent / EMI">🏠 Rent / EMI</option>
                <option value="Subscriptions">📺 Subscriptions</option>
                <option value="Transport">🚌 Transport</option>
                <option value="Entertainment">🎮 Entertainment</option>
                <option value="Utilities">⚡ Utilities</option>
                <option value="Medical">💊 Medical</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Freelance">💻 Freelance</option>
                <option value="Salary">💼 Salary</option>
                <option value="Investment">📈 Investment</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
            <div className="m-group" style={{ maxWidth: "136px" }}>
              <label className="m-label">Date</label>
              <input className="m-input" id="txDate" type="date" />
            </div>
          </div>
          <div className="m-group">
            <label className="m-label">
              Note{" "}
              <span style={{ color: "var(--t3)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <input
              className="m-input"
              id="txNote"
              type="text"
              placeholder="Any extra detail…"
              maxLength={80}
            />
          </div>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={w("closeModal", "txOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="txDelBtn"
              onClick={w("deleteTx")}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button className="m-btn save" onClick={w("submitTx")}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span id="txSaveTxt">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ INCOME SOURCE MODAL ═══ */}
      <div
        className="m-overlay"
        id="incOverlay"
        onClick={(e) =>
          (window as any).overlayClose?.(e.nativeEvent, "incOverlay")
        }
      >
        <div className="m-card">
          <div className="m-title">
            <span id="incModalTitle">Add Income Source</span>
            <button className="m-close" onClick={w("closeModal", "incOverlay")}>
              ✕
            </button>
          </div>
          <div className="m-group">
            <label className="m-label">Source Name</label>
            <input
              className="m-input"
              id="incName"
              type="text"
              placeholder="e.g. Salary, Freelance, Rental…"
              maxLength={40}
            />
          </div>
          <div className="m-row">
            <div className="m-group">
              <label className="m-label">Monthly Amount</label>
              <input
                className="m-input"
                id="incAmt"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div className="m-group">
              <label className="m-label">Type</label>
              <select className="m-select" id="incType">
                <option value="Salary">💼 Salary</option>
                <option value="Freelance">💻 Freelance</option>
                <option value="Business">🏢 Business</option>
                <option value="Rental">🏠 Rental</option>
                <option value="Investment">📈 Investment</option>
                <option value="Side Hustle">⚡ Side Hustle</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
          </div>
          <div className="m-group">
            <label className="m-label">Icon</label>
            <div className="emoji-grid" id="incEmojiGrid"></div>
          </div>
          <p className="m-note">
            Counted every month automatically. Add one-time income as a
            transaction instead.
          </p>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={w("closeModal", "incOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="incDelBtn"
              onClick={w("deleteIncome")}
              style={{ display: "none" }}
            >
              Remove
            </button>
            <button className="m-btn save" onClick={w("submitIncome")}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span id="incSaveTxt">Add Source</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ DUE MODAL ═══ */}
      <div
        className="m-overlay"
        id="dueOverlay"
        onClick={(e) =>
          (window as any).overlayClose?.(e.nativeEvent, "dueOverlay")
        }
      >
        <div className="m-card">
          <div className="m-title">
            <span id="dueModalTitle">Add Fixed Due</span>
            <button className="m-close" onClick={w("closeModal", "dueOverlay")}>
              ✕
            </button>
          </div>
          <div className="m-group">
            <label className="m-label">Name</label>
            <input
              className="m-input"
              id="dueName"
              type="text"
              placeholder="e.g. Netflix, Rent, Car loan…"
              maxLength={40}
            />
          </div>
          <div className="m-row">
            <div className="m-group">
              <label className="m-label">Amount</label>
              <input
                className="m-input"
                id="dueAmt"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div className="m-group">
              <label className="m-label">Due Day of Month</label>
              <input
                className="m-input"
                id="dueDay"
                type="number"
                placeholder="e.g. 1, 15, 28"
                min={1}
                max={31}
              />
            </div>
          </div>
          <div className="m-row">
            <div className="m-group">
              <label className="m-label">Category</label>
              <select className="m-select" id="dueCat">
                <option value="Rent / EMI">🏠 Rent / EMI</option>
                <option value="Subscriptions">📺 Subscriptions</option>
                <option value="Utilities">⚡ Utilities</option>
                <option value="Medical">💊 Medical</option>
                <option value="Transport">🚌 Transport</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
            <div className="m-group">
              <label className="m-label">Icon</label>
              <div className="emoji-grid" id="dueEmojiGrid"></div>
            </div>
          </div>
          <p className="m-note">Repeats every month. Mark paid each month.</p>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={w("closeModal", "dueOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="dueDelBtn"
              onClick={w("deleteDue")}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button className="m-btn save" onClick={w("submitDue")}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span id="dueSaveTxt">Add Due</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ SAVINGS GOAL MODAL ═══ */}
      <div
        className="m-overlay"
        id="goalOverlay"
        onClick={(e) =>
          (window as any).overlayClose?.(e.nativeEvent, "goalOverlay")
        }
      >
        <div className="m-card">
          <div className="m-title">
            <span id="goalModalTitle">Add Savings Goal</span>
            <button
              className="m-close"
              onClick={w("closeModal", "goalOverlay")}
            >
              ✕
            </button>
          </div>
          <div className="m-row">
            <div className="m-group">
              <label className="m-label">Goal Name</label>
              <input
                className="m-input"
                id="goalName"
                type="text"
                placeholder="e.g. Emergency Fund, Vacation…"
                maxLength={40}
              />
            </div>
            <div className="m-group" style={{ maxWidth: "130px" }}>
              <label className="m-label">Target Amount</label>
              <input
                className="m-input"
                id="goalTarget"
                type="number"
                placeholder="0"
                min={0}
                step={0.01}
              />
            </div>
          </div>
          <div className="m-group">
            <label className="m-label">Amount Saved Towards This Goal</label>
            <input
              className="m-input"
              id="goalCurrent"
              type="number"
              placeholder="0"
              min={0}
              step={0.01}
            />
          </div>
          <div className="m-group">
            <label className="m-label">Emoji</label>
            <div className="emoji-grid" id="goalEmojiGrid"></div>
          </div>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={w("closeModal", "goalOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="goalDelBtn"
              onClick={w("deleteGoal")}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button className="m-btn save" onClick={w("submitGoal")}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span id="goalSaveTxt">Add Goal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ HABIT MODAL ═══ */}
      <div
        className="m-overlay"
        id="habitOverlay"
        onClick={(e) => (window as any).overlayCloseHabit?.(e.nativeEvent)}
      >
        <div className="m-card">
          <div className="m-title">
            <span id="habitModalTitle">New Habit</span>
            <button
              className="m-close"
              onClick={w("closeModal", "habitOverlay")}
            >
              ✕
            </button>
          </div>
          <div className="m-group">
            <label className="m-label">Name</label>
            <input
              className="m-input"
              id="mName"
              type="text"
              placeholder="e.g. Morning run, Read 20 pages…"
              maxLength={40}
            />
          </div>
          <div className="m-group">
            <label className="m-label">Icon</label>
            <div className="emoji-grid" id="emojiGrid"></div>
          </div>
          <div className="m-group">
            <label className="m-label">Time of day</label>
            <select className="m-select" id="mTime">
              <option value="Morning">🌅 Morning</option>
              <option value="Afternoon">☀️ Afternoon</option>
              <option value="Evening">🌙 Evening</option>
              <option value="Anytime">⚡ Anytime</option>
            </select>
          </div>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={w("closeModal", "habitOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="mDelBtn"
              onClick={w("confirmDeleteHabit")}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button className="m-btn save" onClick={w("submitHabitModal")}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span id="mSaveTxt">Add Habit</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CONFIRM HABIT DELETE ═══ */}
      <div
        className="m-overlay"
        id="habitConfirmOverlay"
        onClick={(e) =>
          (window as any).overlayClose?.(e.nativeEvent, "habitConfirmOverlay")
        }
      >
        <div className="confirm-card">
          <div className="confirm-title">Delete Habit?</div>
          <div className="confirm-msg">
            This will remove the habit and all its history. This cannot be
            undone.
          </div>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={w("closeModal", "habitConfirmOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              style={{ flex: 2 }}
              onClick={w("doDeleteHabit")}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ONBOARDING ═══ */}
      <div className="m-overlay" id="onboardOverlay" style={{ zIndex: 600 }}>
        <div className="m-card onboard-card">
          <div className="onboard-logo">
            <img
              src="/evolve-logo.svg"
              height={48}
              style={{
                display: "block",
                height: "48px",
                width: "auto",
                margin: "0 auto",
              }}
              alt="Evolve logo"
            />
          </div>
          <div className="onboard-title">Welcome to Evolve</div>
          <div className="onboard-sub">
            Your all-in-one tracker for budget, habits, and savings —
            beautifully combined.
          </div>
          <div className="m-group" style={{ textAlign: "left" }}>
            <label className="m-label">Your Name</label>
            <input
              className="m-input"
              id="obName"
              type="text"
              placeholder="e.g. Alex"
              maxLength={30}
              onInput={() => {
                const el = document.getElementById("obErr");
                if (el) el.style.display = "none";
              }}
            />
            <div className="err-msg" id="obErr">
              Please enter your name to continue
            </div>
          </div>
          <div className="m-group" style={{ textAlign: "left" }}>
            <label className="m-label">
              Primary Monthly Income{" "}
              <span style={{ color: "var(--t3)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <input
              className="m-input"
              id="obIncome"
              type="number"
              placeholder="e.g. 5000"
              min={0}
              step={0.01}
            />
            <p className="m-note" style={{ marginTop: "4px" }}>
              You can add more sources anytime from Budget.
            </p>
          </div>
          <button className="onboard-btn" onClick={w("submitOnboard")}>
            Get Started →
          </button>
        </div>
      </div>

      {/* ═══ TUTORIAL ═══ */}
      <div className="tut-backdrop" id="tutBackdrop"></div>
      <div className="tut-hole" id="tutHole" style={{ display: "none" }}></div>
      <div className="tut-card" id="tutCard" style={{ display: "none" }}>
        <div className="tut-step-pip" id="tutPips"></div>
        <span className="tut-icon" id="tutIcon">
          👋
        </span>
        <div className="tut-title" id="tutTitle"></div>
        <div className="tut-body" id="tutBody"></div>
        <div className="tut-actions">
          <button className="tut-skip" onClick={w("endTutorial")}>
            Skip tour
          </button>
          <button className="tut-next" id="tutNextBtn" onClick={w("tutNext")}>
            Next{" "}
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
              <path
                d="M2.5 5.5h6M6 3l2.5 2.5L6 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
