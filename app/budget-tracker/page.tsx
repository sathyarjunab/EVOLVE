"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import "./budgetflow.css";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "../AuthContextProvider";
import { useRouter } from "next/navigation";

export default function BudgetFlowPage() {
  const { logout, user, loading } = useAuth();
  const router = useRouter();
  const [dbData, setDbData] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/landing");
      } else {
        // Users with both trackers go to the combined tracker
        const access = Array.isArray((user as any).access) ? (user as any).access as string[] : [];
        if (access.includes("habit_tracker") && access.includes("money_tracker")) {
          router.push("/combined-tracker");
        }
      }
    }
  }, [loading, user]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
  }

  useEffect(() => {
    fetch("/api/budget/init")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        return data;
      })
      .then((data) => {
        if (data.success && data.state) setDbData(data.state);
      })
      .catch(() => {
        // Fallback: still render so user sees the page (JS will handle onboarding)
        setDbData({});
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
          fontSize: "0.85rem",
        }}
      >
        Loading BudgetFlow…
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
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Inject full budget state for budgetflow-init.js */}
      <Script
        id="budgetflow-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dbData) }}
      />

      {/* Chart.js */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"
        strategy="afterInteractive"
      />

      {/* BudgetFlow logic */}
      <Script src="/budgetflow-init.js" strategy="afterInteractive" />

      {/* ═══ NAV ═══ */}
      <nav>
        <div className="logo-wrap">
          <img
            src="/evolve-logo.svg"
            className="nav-logo-svg"
            alt="Evolve logo"
          />
        </div>

        {/* Mobile hamburger */}
        <button
          className="mob-menu-btn"
          id="mobMenuBtn"
          onClick={() => (window as any).toggleMobDrawer?.()}
          aria-label="Period"
        >
          <div className="hb-lines">
            <span className="hb-line"></span>
            <span className="hb-line"></span>
            <span className="hb-line"></span>
          </div>
        </button>

        <div className="nav-tabs">
          <button
            className="ntab active"
            onClick={() => (window as any).showPage?.("overview")}
            id="tab-overview"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect
                x="1"
                y="1"
                width="5"
                height="5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <rect
                x="7"
                y="1"
                width="5"
                height="5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <rect
                x="1"
                y="7"
                width="5"
                height="5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <rect
                x="7"
                y="7"
                width="5"
                height="5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
            Overview
          </button>
          <button
            className="ntab"
            onClick={() => (window as any).showPage?.("ledger")}
            id="tab-ledger"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M2 3h9M2 6.5h9M2 10h6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            Ledger
          </button>
        </div>

        <div className="nav-right">
          {/* Currency selector */}
          <div className="nav-sel-wrap" title="Currency">
            <span className="nsw-icon">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              onChange={() => (window as any).onCurrencyChange?.()}
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
              <option value="S$">S$ SGD</option>
              <option value="د.إ">د.إ AED</option>
            </select>
            <span className="nsw-chev">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              onChange={() => (window as any).onPeriodChange?.()}
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
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              onChange={() => (window as any).onPeriodChange?.()}
              style={{ minWidth: "76px" }}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
            <span className="nsw-chev">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          {/* Logout button */}
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

          <div className="avatar" title="Profile"></div>
        </div>
      </nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      <div
        className="mob-drawer-backdrop"
        id="mobDrawerBackdrop"
        onClick={() => (window as any).closeMobDrawer?.()}
      ></div>
      <div className="mob-drawer" id="mobDrawer">
        <div className="mob-drawer-inner">
          <div className="mob-drawer-section-lbl">View Period</div>
          <div className="mob-drawer-selectors">
            <div className="mob-period-btn">
              <svg
                className="mpb-icon"
                width="13"
                height="13"
                viewBox="0 0 12 12"
                fill="none"
              >
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
              <select
                className="mob-period-select"
                id="mobYear"
                onChange={() => (window as any).syncMobPeriod?.()}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
              <svg
                className="mpb-chev"
                width="11"
                height="11"
                viewBox="0 0 10 10"
                fill="none"
              >
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="mob-period-btn">
              <svg
                className="mpb-icon"
                width="13"
                height="13"
                viewBox="0 0 12 12"
                fill="none"
              >
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
              <select
                className="mob-period-select"
                id="mobMonth"
                onChange={() => (window as any).syncMobPeriod?.()}
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
              <svg
                className="mpb-chev"
                width="11"
                height="11"
                viewBox="0 0 10 10"
                fill="none"
              >
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="content">
        {/* ═══ OVERVIEW PAGE ═══ */}
        <div className="page active" id="page-overview">
          {/* Top row */}
          <div className="top-row">
            <div className="welcome">
              <div className="welcome-sub">Welcome back,</div>
              <div className="welcome-name" id="wName">
                Your
                <br />
                <span>Budget</span>
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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                        stroke="var(--red)"
                        strokeWidth="1.2"
                      />
                      <rect
                        x="7.5"
                        y="9"
                        width="2"
                        height="3"
                        rx=".5"
                        stroke="var(--red)"
                        strokeWidth="1.2"
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

              {/* Saved this month */}
              <div className="scard lime-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

              {/* Due this week */}
              <div className="scard amb-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

              {/* Income */}
              <div className="scard grn-t">
                <div className="scard-top">
                  <div className="scard-icon">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

          {/* Budget bar */}
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

          {/* Charts + Income + Dues */}
          <div className="panels-row" style={{ minHeight: "286px" }}>
            {/* Donut */}
            <div className="panel chart-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
              <div id="donutWrap">
                <canvas
                  id="donutChart"
                  style={{ maxWidth: "152px", maxHeight: "152px" }}
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

            {/* Money Flow */}
            <div className="panel flow-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                    fontSize: ".72rem",
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                  onClick={() => (window as any).openIncomeModal?.()}
                  title="Add income source"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
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
                    fontSize: ".72rem",
                    color: "var(--t3)",
                    textAlign: "center",
                    padding: "16px 0",
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                  onClick={() => (window as any).openDueModal?.()}
                  title="Add due"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
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
                    fontSize: ".72rem",
                    color: "var(--t3)",
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No fixed dues yet
                </div>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="panel recent-panel">
            <div className="panel-head">
              <div className="panel-title">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                  fontSize: ".72rem",
                  padding: "4px 12px",
                  background: "var(--s2)",
                  color: "var(--t2)",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Manrope',sans-serif",
                  fontWeight: 600,
                }}
                onClick={() => (window as any).showPage?.("ledger")}
              >
                View all →
              </button>
            </div>
            <div className="tx-list" id="recentList"></div>
          </div>

          {/* Savings Section */}
          <div className="section-divider">
            <div className="section-divider-line"></div>
            <span className="section-divider-lbl">💰 Savings</span>
            <div className="section-divider-line"></div>
          </div>

          <div className="savings-section">
            {/* Summary row */}
            <div
              className="sv-summary-row"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
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
                  style={{ marginTop: "6px", display: "inline-block" }}
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

            {/* Hidden elements for JS compatibility */}
            <span id="scInc" style={{ display: "none" }}></span>
            <span id="scExp" style={{ display: "none" }}></span>
            <span id="scSaved" style={{ display: "none" }}></span>

            {/* Goals */}
            <div className="savings-section-head">
              <div className="savings-section-title">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                onClick={() => (window as any).openGoalModal?.()}
                title="Add goal"
                style={{ width: "28px", height: "28px" }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
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

        {/* ═══ LEDGER PAGE ═══ */}
        <div className="page" id="page-ledger">
          <div className="ledger-controls">
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
                id="ledgerSearch"
                type="text"
                placeholder="Search transactions…"
                onInput={() => (window as any).renderLedger?.()}
              />
            </div>
            <button
              className="fpill active"
              data-lf="all"
              onClick={() => (window as any).setLedgerFilter?.("all")}
            >
              All
            </button>
            <button
              className="fpill"
              data-lf="income"
              onClick={() => (window as any).setLedgerFilter?.("income")}
            >
              Income
            </button>
            <button
              className="fpill"
              data-lf="expense"
              onClick={() => (window as any).setLedgerFilter?.("expense")}
            >
              Expenses
            </button>
            <button
              className="dl-btn"
              onClick={() => (window as any).exportCSV?.()}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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

      {/* FAB desktop */}
      <button
        className="fab"
        onClick={() => (window as any).openTxModal?.()}
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

      {/* Mobile bottom nav */}
      <div className="mob-nav-outer" id="mobNavOuter">
        <div className="mob-nav">
          <div className="mob-nav-left">
            <button
              className="mob-nav-item active"
              id="mob-tab-overview"
              onClick={() => (window as any).showPage?.("overview")}
            >
              <svg
                width="20"
                height="20"
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
          </div>
          <div className="mob-nav-gap"></div>
          <div className="mob-nav-right">
            <button
              className="mob-nav-item"
              id="mob-tab-ledger"
              onClick={() => (window as any).showPage?.("ledger")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M4 6h12M4 10h12M4 14h7" />
              </svg>
              <span>Ledger</span>
            </button>
          </div>
          <div className="mob-fab-outer">
            <button
              className="mob-fab"
              onClick={() => (window as any).openTxModal?.()}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
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
            <button
              className="m-close"
              onClick={() => (window as any).closeModal?.("txOverlay")}
            >
              ✕
            </button>
          </div>
          <div className="m-type-row">
            <button
              className="m-type-btn sel-expense"
              id="typeExpense"
              onClick={() => (window as any).setTxType?.("expense")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              onClick={() => (window as any).setTxType?.("income")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              onClick={() => (window as any).setTxType?.("savings")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
            <div className="m-group" style={{ maxWidth: "118px" }}>
              <label className="m-label">Amount</label>
              <input
                className="m-input"
                id="txAmt"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
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
            <div className="m-group" style={{ maxWidth: "140px" }}>
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
              onClick={() => (window as any).closeModal?.("txOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="txDelBtn"
              onClick={() => (window as any).deleteTx?.()}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button
              className="m-btn save"
              onClick={() => (window as any).submitTx?.()}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
            <button
              className="m-close"
              onClick={() => (window as any).closeModal?.("incOverlay")}
            >
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
                min="0"
                step="0.01"
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
              onClick={() => (window as any).closeModal?.("incOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="incDelBtn"
              onClick={() => (window as any).deleteIncome?.()}
              style={{ display: "none" }}
            >
              Remove
            </button>
            <button
              className="m-btn save"
              onClick={() => (window as any).submitIncome?.()}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
            <button
              className="m-close"
              onClick={() => (window as any).closeModal?.("dueOverlay")}
            >
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
                min="0"
                step="0.01"
              />
            </div>
            <div className="m-group">
              <label className="m-label">Due Day of Month</label>
              <input
                className="m-input"
                id="dueDay"
                type="number"
                placeholder="e.g. 1, 15, 28"
                min="1"
                max="31"
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
          <p className="m-note">
            Repeats every month. Mark paid each month. Overdue items highlight
            red, due within 7 days show amber.
          </p>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={() => (window as any).closeModal?.("dueOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="dueDelBtn"
              onClick={() => (window as any).deleteDue?.()}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button
              className="m-btn save"
              onClick={() => (window as any).submitDue?.()}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              onClick={() => (window as any).closeModal?.("goalOverlay")}
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
                min="0"
                step="0.01"
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
              min="0"
              step="0.01"
            />
          </div>
          <div className="m-group">
            <label className="m-label">Emoji</label>
            <div className="emoji-grid" id="goalEmojiGrid"></div>
          </div>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={() => (window as any).closeModal?.("goalOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="goalDelBtn"
              onClick={() => (window as any).deleteGoal?.()}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button
              className="m-btn save"
              onClick={() => (window as any).submitGoal?.()}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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

      {/* ═══ BANK BALANCE MODAL ═══ */}
      <div
        className="m-overlay"
        id="bankOverlay"
        onClick={(e) =>
          (window as any).overlayClose?.(e.nativeEvent, "bankOverlay")
        }
      >
        <div className="m-card">
          <div className="m-title">
            <span>💳 Bank Balance</span>
            <button
              className="m-close"
              onClick={() => (window as any).closeModal?.("bankOverlay")}
            >
              ✕
            </button>
          </div>
          <div className="m-group">
            <label className="m-label">Balance</label>
            <input
              className="m-input"
              id="bankBalInput"
              type="number"
              placeholder="e.g. 50000"
              min="0"
              step="0.01"
              style={{ fontSize: "1.1rem", fontWeight: 700, height: "44px" }}
            />
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
              id="bankBalNote"
              type="text"
              placeholder="e.g. Includes FD, savings account…"
              maxLength={60}
            />
          </div>
          <p className="m-note">
            This is a manual snapshot. Update it whenever you check your bank.
          </p>
          <div className="m-actions">
            <button
              className="m-btn cancel"
              onClick={() => (window as any).closeModal?.("bankOverlay")}
            >
              Cancel
            </button>
            <button
              className="m-btn save"
              onClick={() => (window as any).saveBankModal?.()}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ONBOARDING ═══ */}
      <div className="m-overlay" id="onboardOverlay" style={{ zIndex: 600 }}>
        <div className="m-card onboard-card">
          <div className="onboard-logo">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path
                d="M13 3v20M5 8l8-5 8 5"
                stroke="var(--lime)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="onboard-title">Welcome to BudgetFlow</div>
          <div className="onboard-sub">
            Let&apos;s start by entering your monthly income.
          </div>
          <div className="m-group" style={{ marginBottom: 0 }}>
            <label className="m-label">Monthly Income</label>
            <input
              className="m-input"
              id="obIncome"
              type="number"
              placeholder="e.g. 3000"
              min="0"
              step="0.01"
            />
            <div
              id="obErr"
              style={{
                color: "var(--red)",
                fontSize: ".7rem",
                marginTop: "5px",
                display: "none",
              }}
            ></div>
          </div>
          <button
            className="m-btn save onboard-btn"
            onClick={() => (window as any).submitOnboard?.()}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="#111"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Get Started
          </button>
        </div>
      </div>

      {/* ═══ TUTORIAL OVERLAY ═══ */}
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
          <button
            className="tut-skip"
            onClick={() => (window as any).endTutorial?.()}
          >
            Skip tour
          </button>
          <button
            className="tut-next"
            id="tutNextBtn"
            onClick={() => (window as any).tutNext?.()}
          >
            Next{" "}
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
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
