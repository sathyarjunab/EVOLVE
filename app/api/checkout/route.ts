import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { Access } from "@/proxy";
import { plans } from "@/util/types";

export type CheckoutProduct = "budget_tracker" | "habit_tracker" | "bundle";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify auth via cookie
    const jwtUser = await getUser();
    if (!jwtUser || !jwtUser.id) {
      return NextResponse.json(
        { error: "not_authenticated" },
        { status: 401 },
      );
    }

    // 2. Parse + validate requested product
    const body = await req.json();
    const product: CheckoutProduct = body.product;
    if (
      !product ||
      !["budget_tracker", "habit_tracker", "bundle"].includes(product)
    ) {
      return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    // 3. Fetch fresh access from DB (JWT payload may be stale)
    const dbUser = await prisma.user.findUnique({
      where: { id: jwtUser.id as string },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "not_authenticated" },
        { status: 401 },
      );
    }
    const access = (dbUser.access ?? {}) as Access;

    // 4. Guard: user already owns what they're trying to buy
    if (product === "budget_tracker" && access.budget_tracker) {
      const redirect = access.habit_tracker
        ? "/combined-tracker"
        : "/budget-tracker";
      return NextResponse.json(
        { error: "already_subscribed", redirect },
        { status: 409 },
      );
    }
    if (product === "habit_tracker" && access.habit_tracker) {
      const redirect = access.budget_tracker
        ? "/combined-tracker"
        : "/habitTracker";
      return NextResponse.json(
        { error: "already_subscribed", redirect },
        { status: 409 },
      );
    }
    if (
      product === "bundle" &&
      access.habit_tracker &&
      access.budget_tracker
    ) {
      return NextResponse.json(
        { error: "already_subscribed", redirect: "/combined-tracker" },
        { status: 409 },
      );
    }

    // 5. Pick the correct Shopify cart URL from the plans registry
    let baseUrl: string;
    if (product === "budget_tracker") {
      baseUrl = plans.BudgetTracker.checkoutUrl;
    } else if (product === "habit_tracker") {
      baseUrl = plans.HabitTracker.checkoutUrl;
    } else {
      baseUrl = plans.CombinedTracker.checkoutUrl;
    }

    const checkoutUrl =
      baseUrl +
      `?checkout[email]=${encodeURIComponent(dbUser.email ?? "")}` +
      `&attributes[userId]=${encodeURIComponent(dbUser.id)}` +
      `&checkout[return_url]=${encodeURIComponent(
        process.env.NEXT_PUBLIC_DOMAIN!,
      )}`;

    return NextResponse.json({ success: true, url: checkoutUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
