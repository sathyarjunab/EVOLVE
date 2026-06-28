"use server";

import { cookies } from "next/headers";

// Cookie that carries an influencer coupon code from the landing-page URL
// through to checkout. Lives 30 days so a referral survives a browse session.
// NOTE: a "use server" file may ONLY export async functions. Keep this constant
// un-exported, otherwise Next.js turns it into a server-action reference.
const COUPON_COOKIE = "coupon_code";
const COUPON_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const COUPON_REGEX = /^[A-Z0-9_-]+$/i;

/**
 * Persist a coupon code (from `?coupon=` on the landing page) into a cookie so
 * it can be read later when the checkout is created.
 */
export async function storeCouponCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();

  // Ignore anything that can't be a valid code rather than poisoning the cookie
  if (!code || code.length > 100 || !COUPON_REGEX.test(code)) {
    return { success: false };
  }

  (await cookies()).set(COUPON_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COUPON_MAX_AGE,
  });

  return { success: true };
}

/** Read the stored coupon code, if any. */
export async function getStoredCouponCode() {
  return (await cookies()).get(COUPON_COOKIE)?.value ?? null;
}
