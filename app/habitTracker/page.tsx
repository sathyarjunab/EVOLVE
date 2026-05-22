"use client";

import { useEffect, useState } from "react";

import Script from "next/script";
import "./habitflow.css";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuth } from "../AuthContextProvider";

const w =
  (fn: string, ...args: unknown[]) =>
  () =>
    (window as any)[fn]?.(...args);
const wE = (fn: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
  (window as any)[fn]?.(e.target.value);

const YEARS = ["2024", "2025", "2026", "2027", "2028"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function HabitFlowPage() {
  const { logout } = useAuth();
  const [dbData, setDbData] = useState(null);

  useEffect(() => {
    (window as any).showToast = (msg: string) => {
      toast.error(msg);
    };

    fetch("/api/habit/init")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Request failed");
        }
        return data;
      })
      .then((data) => {
        if (data.success && data.state) {
          setDbData(data.state);
        }
      })
      .catch((err) => {
        toast.error("Failed to fetch initial habit state");
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
        Loading HabitFlow...
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
      <Script
        id="habitflow-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dbData).replace(/</g, "\\u003c"), // This is importent to prevent script injection
        }}
      />
      {/* HabitFlow logic */}
      <Script src="/habitflow-init.js" strategy="afterInteractive" />

      {/* ═══ NAV ═══ */}
      <nav>
        <div
          style={{
            width: "auto",
            height: "48px",
            background: "transparent",
            borderRadius: 0,
            padding: 0,
            marginRight: "16px",
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
        <div className="nav-tabs">
          <button
            className="ntab active"
            onClick={(e) => (window as any).setNav?.(e.currentTarget)}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect
                x="1"
                y="1"
                width="4.5"
                height="4.5"
                rx="1.2"
                fill="currentColor"
                opacity=".7"
              />
              <rect
                x="7.5"
                y="1"
                width="4.5"
                height="4.5"
                rx="1.2"
                fill="currentColor"
                opacity=".4"
              />
              <rect
                x="1"
                y="7.5"
                width="4.5"
                height="4.5"
                rx="1.2"
                fill="currentColor"
                opacity=".4"
              />
              <rect
                x="7.5"
                y="7.5"
                width="4.5"
                height="4.5"
                rx="1.2"
                fill="currentColor"
              />
            </svg>
            Dashboard
          </button>
        </div>

        {/* Year/Month dropdowns */}
        <div className="nav-dropdowns">
          <div className="nav-select-wrap">
            <span className="nsw-icon">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect
                  x="1"
                  y="2"
                  width="9"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M3.5 1v2M7.5 1v2M1 5h9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <select
              id="navYear"
              className="nav-select"
              onChange={() => (window as any).onNavFilterChange?.()}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="nsw-chevron">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path
                  d="M2 3.5L4.5 6L7 3.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
          <div className="nav-select-wrap">
            <span className="nsw-icon">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M1.5 5.5L4.5 8.5L9.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <select
              id="navMonth"
              className="nav-select"
              onChange={() => (window as any).onNavFilterChange?.()}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <span className="nsw-chevron">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path
                  d="M2 3.5L4.5 6L7 3.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
          <div className="nav-period-badge" id="navPeriodBadge">
            May 2026
          </div>
        </div>

        <div className="nav-right">
          <a
            className="nav-feedback-btn"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1.5C3.5 1.5 1.5 3.1 1.5 5c0 .8.3 1.6.9 2.2L2 10l2.5-1.2C5 9 5.5 9.1 6 9.1c2.5 0 4.5-1.6 4.5-3.6S8.5 1.5 6 1.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <span>Feedback</span>
          </a>
          <a
            className="nav-icon nav-insta"
            href="https://www.instagram.com/evolvee.ai/"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="1.5"
                y="1.5"
                width="13"
                height="13"
                rx="3.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <circle
                cx="8"
                cy="8"
                r="2.8"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <circle cx="11.5" cy="4.5" r=".7" fill="currentColor" />
            </svg>
          </a>
          <button
            className="nav-feedback-btn"
            onClick={() => logout()}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LogOut size={12} strokeWidth={2} />
            <span>Logout</span>
          </button>
          <button
            id="navHamburger"
            className="nav-hamburger"
            onClick={() => (window as any).toggleDrawer?.()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              id="hamburgerIcon"
            >
              <path
                d="M2 4h12M2 8h12M2 12h12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="avatar" title="Profile"></div>
        </div>
      </nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      <div className="mobile-drawer" id="mobileDrawer">
        <div className="drawer-section">
          <div className="drawer-label">Period</div>
          <div className="drawer-dropdowns">
            <div className="nav-select-wrap">
              <span className="nsw-icon">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect
                    x="1"
                    y="2"
                    width="9"
                    height="8"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M3.5 1v2M7.5 1v2M1 5h9"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <select
                id="navYearMobile"
                className="nav-select"
                onChange={(e) =>
                  (window as any).syncDrawerToNav?.("year", e.target.value)
                }
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="nsw-chevron">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d="M2 3.5L4.5 6L7 3.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </div>
            <div className="nav-select-wrap">
              <span className="nsw-icon">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M1.5 5.5L4.5 8.5L9.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <select
                id="navMonthMobile"
                className="nav-select"
                onChange={(e) =>
                  (window as any).syncDrawerToNav?.("month", e.target.value)
                }
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="nsw-chevron">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d="M2 3.5L4.5 6L7 3.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
        <div className="drawer-divider"></div>
        <div className="drawer-section">
          <div className="drawer-label">Quick Actions</div>
          <div className="drawer-actions">
            <button
              className="drawer-link"
              onClick={() => {
                (window as any).exportData?.();
                (window as any).closeDrawer?.();
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 2v7M4 7l2.5 3L9 7M2 11h9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download Report
            </button>
            <button
              className="drawer-link"
              onClick={() => {
                (window as any).openModal?.();
                (window as any).closeDrawer?.();
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 2v9M2 6.5h9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Add Habit
            </button>
            <button
              className="drawer-link"
              onClick={() => {
                logout();
                (window as any).closeDrawer?.();
              }}
            >
              <LogOut size={13} strokeWidth={1.4} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="content">
        {/* Top Row */}
        <div className="top-row">
          <div className="welcome">
            <div className="welcome-sub">Good morning,</div>
            <div className="welcome-name" id="wName">
              Friend
            </div>
            <span className="badge-prem">✦ Premium</span>
          </div>
          <div className="stat-cards">
            <div className="scard">
              <div className="scard-top">
                <div className="scard-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 11L5 8l3 2 4-5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <button className="sarrow">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5h6M5 2l3 3-3 3"
                      stroke="#111"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="scard-label">Total Completed</div>
              <div className="scard-val" id="sv1">
                0
              </div>
              <div className="scard-delta" id="sd1">
                <span className="delta-pos">all time</span>
              </div>
            </div>
            <div className="scard">
              <div className="scard-top">
                <div className="scard-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 2.5c-1.5 0-3 1-3 2.5 0 2 3 6 3 6s3-4 3-6c0-1.5-1.5-2.5-3-2.5Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <circle cx="7" cy="5" r="1" fill="currentColor" />
                  </svg>
                </div>
                <button className="sarrow">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5h6M5 2l3 3-3 3"
                      stroke="#111"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="scard-label">Current Streak</div>
              <div className="scard-val" id="sv2">
                0
                <span
                  style={{
                    fontSize: ".8rem",
                    fontWeight: 500,
                    color: "var(--t2)",
                    marginLeft: "4px",
                  }}
                >
                  days
                </span>
              </div>
              <div className="scard-delta" id="sd2">
                Best: <span id="bestStreakVal">0</span> days
              </div>
            </div>
            <div className="scard lime">
              <div className="scard-top">
                <div className="scard-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle
                      cx="7"
                      cy="7"
                      r="5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M7 4.5v2.8l2 1.2"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <button className="sarrow">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5h6M5 2l3 3-3 3"
                      stroke="#111"
                      strokeWidth="1.5"
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

        {/* Filter Row */}
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
          <div className="filter-actions">
            <button
              className="dl-btn"
              onClick={() => (window as any).exportData?.()}
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
              Download reports
            </button>
          </div>
        </div>

        {/* Panels Row */}
        <div className="panels-row">
          {/* Today's Habits panel */}
          <div className="panel panel-habits-tall">
            <div className="panel-head">
              <div className="panel-title">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                onClick={() => (window as any).openModal?.()}
                title="Add habit"
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
                onInput={() => (window as any).renderHabits?.()}
              />
            </div>
            <div className="habits-list" id="habitsList"></div>
          </div>

          {/* Right column */}
          <div className="panels-right">
            <div className="panels-top">
              {/* Bar chart panel */}
              <div className="panel">
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
                    Habit Completion
                  </div>
                  <div className="panel-controls">
                    <div className="toggle-group">
                      <button
                        className="tgl"
                        data-period="monthly"
                        onClick={() => (window as any).setPeriod?.("monthly")}
                      >
                        Monthly
                      </button>
                      <button
                        className="tgl active"
                        data-period="annually"
                        onClick={() => (window as any).setPeriod?.("annually")}
                      >
                        Annually
                      </button>
                    </div>
                    <button className="dots-btn">···</button>
                  </div>
                </div>
                <div id="chartWrap">
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

              {/* Heatmap panel */}
              <div className="panel">
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
                        d="M7 3.5v4l2.5 1.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    Activity Map
                  </div>
                  <div className="panel-controls">
                    <button className="dd-btn">
                      Weekly{" "}
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path
                          d="M2 3.5L4.5 6L7 3.5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="hm-legend">
                  <span style={{ fontSize: ".6rem", color: "var(--t3)" }}>
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
                  <span style={{ fontSize: ".6rem", color: "var(--t3)" }}>
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

            {/* Line chart panel */}
            <div className="line-panel">
              <div className="panel-head" style={{ marginBottom: "8px" }}>
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
                  Daily Progress
                </div>
                <div className="panel-controls">
                  <div className="toggle-group">
                    <button
                      className="tgl active"
                      data-lv="month"
                      onClick={() => (window as any).setLineView?.("month")}
                    >
                      Month
                    </button>
                    <button
                      className="tgl"
                      data-lv="year"
                      onClick={() => (window as any).setLineView?.("year")}
                    >
                      Year
                    </button>
                  </div>
                  <span
                    id="lineViewLabel"
                    style={{
                      fontSize: ".7rem",
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

      {/* ═══ ADD / EDIT MODAL ═══ */}
      <div
        className="m-overlay"
        id="mOverlay"
        onClick={(e) => (window as any).overlayClose?.(e.nativeEvent)}
      >
        <div className="m-card">
          <div className="m-title">
            <span id="mTitleText">New Habit</span>
            <button
              className="m-close"
              onClick={() => (window as any).closeModal?.()}
            >
              &#x2715;
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
              onClick={() => (window as any).closeModal?.()}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              id="mDelBtn"
              onClick={() => (window as any).confirmDelete?.()}
              style={{ display: "none" }}
            >
              Delete
            </button>
            <button
              className="m-btn save"
              onClick={() => (window as any).submitModal?.()}
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
              <span id="mSaveTxt">Add Habit</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ONBOARDING ═══ */}
      {/* <div className="m-overlay" id="onboardOverlay">
        <div className="m-card onboard-card">
          <div className="onboard-logo" style={{ width: 'auto', height: '64px', background: 'transparent', borderRadius: 0, padding: 0, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/evolve-logo.svg" height={64} style={{ display: 'block', height: '64px', width: 'auto' }} alt="Evolve logo" />
          </div>
          <div className="onboard-title">Welcome to HabitFlow</div>
          <div className="onboard-sub">Build better habits, one day at a time. Let&#39;s start with your name.</div>
          <div className="m-group" style={{ marginBottom: 0 }}>
            <label className="m-label">Your name</label>
            <input className="m-input" id="onboardName" type="text" placeholder="e.g. Alex Johnson" maxLength={40} onInput={() => (window as any).onboardNameInput?.()} />
            <div id="onboardErr" style={{ color: 'var(--red)', fontSize: '.7rem', marginTop: '5px', display: 'none' }}>Please enter your name to continue.</div>
          </div>
          <button className="m-btn save onboard-btn" id="onboardBtn" onClick={() => (window as any).submitOnboard?.()}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Get Started
          </button>
        </div>
      </div> */}

      {/* ═══ CONFIRM DELETE ═══ */}
      <div
        className="m-overlay"
        id="cOverlay"
        onClick={(e) => (window as any).overlayClose?.(e.nativeEvent)}
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
              onClick={() => (window as any).closeConfirm?.()}
            >
              Cancel
            </button>
            <button
              className="m-btn del"
              style={{ flex: 2 }}
              onClick={() => (window as any).doDelete?.()}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
