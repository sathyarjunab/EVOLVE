import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { Access } from "@/proxy";
import { plans } from "@/util/types";
import { getStoredCouponCode } from "@/app/serverAction/couponAction";
import { createBasicDiscountCode, isShopifyConfigured } from "@/util/shopify";

export type CheckoutProduct = "money_tracker" | "habit_tracker" | "bundle";

/**
 * Turn a stored coupon code into a Shopify discount code that can be applied via
 * the cart-permalink `?discount=` parameter.
 *
 * Creates the Shopify discount lazily on first use and caches its id on the
 * InfluencerLink so subsequent checkouts reuse it (Shopify codes are unique, so
 * we must not recreate them). Returns the code to apply, or null to skip.
 */
async function resolveDiscountCode(couponCode: string | null): Promise<string | null> {
  if (!couponCode || !isShopifyConfigured()) return null;

  try {
    const link = await prisma.influencerLink.findUnique({
      where: { code: couponCode },
    });
    if (!link) return null;

    // Already created in Shopify — just reuse the code.
    if (link.shopifyDiscountId) return link.code;

    const { discountId, errors } = await createBasicDiscountCode({
      code: link.code,
      couponCodeType: link.couponCodeType,
      discountValue: Number(link.discountValue),
    });

    if (!discountId) {
      console.error("Shopify discount creation failed:", errors);
      return null;
    }

    await prisma.influencerLink.update({
      where: { id: link.id },
      data: { shopifyDiscountId: discountId },
    });

    return link.code;
  } catch (err) {
    console.error("resolveDiscountCode error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse + validate requested product
    const body = await req.json();
    const product: CheckoutProduct = body.product;
    if (
      !product ||
      !["money_tracker", "habit_tracker", "bundle"].includes(product)
    ) {
      return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    // 1b. Pull any influencer coupon code captured from the landing-page URL.
    const couponCode = await getStoredCouponCode();

    // 2. Check if the user is logged in (optional — guests can still checkout)
    const jwtUser = await getUser();
    const dbUser = jwtUser?.id
      ? await prisma.user.findUnique({ where: { id: jwtUser.id as string } })
      : null;

    // 3. Guard: only applies to logged-in users who already own the product
    if (dbUser) {
      const access = (dbUser.access ?? {}) as Access;

      if (product === "money_tracker" && access.money_tracker) {
        const redirect = access.habit_tracker
          ? "/combined-tracker"
          : "/money-tracker";
        return NextResponse.json(
          { error: "already_subscribed", redirect },
          { status: 409 },
        );
      }
      if (product === "habit_tracker" && access.habit_tracker) {
        const redirect = access.money_tracker
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
        access.money_tracker
      ) {
        return NextResponse.json(
          { error: "already_subscribed", redirect: "/combined-tracker" },
          { status: 409 },
        );
      }
    }

    // 4. Pick the correct Shopify cart URL
    let baseUrl: string;
    if (product === "money_tracker") {
      baseUrl = plans.MoneyTracker.checkoutUrl;
    } else if (product === "habit_tracker") {
      baseUrl = plans.HabitTracker.checkoutUrl;
    } else {
      baseUrl = plans.CombinedTracker.checkoutUrl;
    }

    // 5. Build checkout URL — attach userId only for logged-in users
    const returnUrl = encodeURIComponent(process.env.NEXT_PUBLIC_DOMAIN!);
    let checkoutUrl = dbUser
      ? baseUrl +
        `?checkout[email]=${encodeURIComponent(dbUser.email)}` +
        `&attributes[userId]=${encodeURIComponent(dbUser.id)}` +
        `&checkout[return_url]=${returnUrl}`
      : baseUrl + `?checkout[return_url]=${returnUrl}`;

    // 6. Resolve the influencer coupon into a Shopify discount and auto-apply it.
    //    Failures here must NEVER block the sale — we just fall back to a normal
    //    checkout without a discount.
    const appliedCode = await resolveDiscountCode(couponCode);
    if (appliedCode) {
      checkoutUrl += `&discount=${encodeURIComponent(appliedCode)}`;
    }

    return NextResponse.json({ success: true, url: checkoutUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
