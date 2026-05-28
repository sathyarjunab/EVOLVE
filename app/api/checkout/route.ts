import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { Access } from "@/proxy";
import { plans } from "@/util/types";

export type CheckoutProduct = "budget_tracker" | "habit_tracker" | "bundle";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse + validate requested product
    const body = await req.json();
    const product: CheckoutProduct = body.product;
    if (
      !product ||
      !["budget_tracker", "habit_tracker", "bundle"].includes(product)
    ) {
      return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    // 2. Check if the user is logged in (optional — guests can still checkout)
    const jwtUser = await getUser();
    const dbUser = jwtUser?.id
      ? await prisma.user.findUnique({ where: { id: jwtUser.id as string } })
      : null;

    // 3. Guard: only applies to logged-in users who already own the product
    if (dbUser) {
      const access = (dbUser.access ?? {}) as Access;

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
      if (product === "bundle" && access.habit_tracker && access.budget_tracker) {
        return NextResponse.json(
          { error: "already_subscribed", redirect: "/combined-tracker" },
          { status: 409 },
        );
      }
    }

    // 4. Pick the correct Shopify cart URL
    let baseUrl: string;
    if (product === "budget_tracker") {
      baseUrl = plans.BudgetTracker.checkoutUrl;
    } else if (product === "habit_tracker") {
      baseUrl = plans.HabitTracker.checkoutUrl;
    } else {
      baseUrl = plans.CombinedTracker.checkoutUrl;
    }

    // 5. Build checkout URL — attach userId only for logged-in users
    const returnUrl = encodeURIComponent(process.env.NEXT_PUBLIC_DOMAIN!);
    const checkoutUrl = dbUser
      ? baseUrl +
        `?checkout[email]=${encodeURIComponent(dbUser.email)}` +
        `&attributes[userId]=${encodeURIComponent(dbUser.id)}` +
        `&checkout[return_url]=${returnUrl}`
      : baseUrl + `?checkout[return_url]=${returnUrl}`;

    return NextResponse.json({ success: true, url: checkoutUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
