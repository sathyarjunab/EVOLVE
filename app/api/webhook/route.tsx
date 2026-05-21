import { prisma } from "@/prisma/prisma";
import { Access } from "@/proxy";
import { plans, ShopifyOrdersPaidWebhook } from "@/util/types";
import crypto from "crypto";

export async function POST(req: Request) {
  const topic = req.headers.get("x-shopify-topic");
  const webhookId = req.headers.get("x-shopify-webhook-id");
  const shopDomain = req.headers.get("x-shopify-shop-domain");
  const triggeredAt = req.headers.get("x-shopify-triggered-at");
  try {
    console.log("WEBHOOK CALLED");
    // RAW BODY
    const rawBody = await req.text();
    await prisma.shopifyWebhookLog.create({
      data: {
        success: true,
        payload: { topic, webhookId, shopDomain, triggeredAt },
      },
    });

    // SHOPIFY HMAC HEADER
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

    if (!hmacHeader) {
      return Response.json(
        {
          error: "Missing HMAC header",
        },
        {
          status: 401,
        },
      );
    }

    // VERIFY WEBHOOK
    const generatedHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET!)
      .update(rawBody, "utf8")
      .digest("base64");

    const isValid = generatedHash === hmacHeader;

    if (!isValid) {
      return Response.json(
        {
          error: "Invalid webhook signature",
        },
        {
          status: 401,
        },
      );
    }

    // PARSE BODY
    const body: ShopifyOrdersPaidWebhook = JSON.parse(rawBody);

    // PAYMENT STATUS
    const paymentStatus = body.financial_status;

    // CUSTOMER EMAIL
    const userID = body.note_attributes.find(({ name, value }) => {
      return name === "userId";
    })?.value;

    if (!userID) {
      return Response.json(
        {
          error: "Invalid userId",
        },
        {
          status: 200,
        },
      );
    }

    // ORDER ID
    const shopifyOrderId = String(body.id);

    // VARIANT ID
    const variantId = body.line_items?.[0]?.variant_id;

    // TOTAL AMOUNT
    const totalPrice = body.current_total_price;

    // CURRENCY
    const currency = body.currency;

    // ONLY PROCESS PAID ORDERS
    if (paymentStatus !== "paid") {
      return Response.json({
        success: true,
        ignored: true,
      });
    }

    // MAP PLAN
    let activePlan: Access = {
      habit_tracker: false,
      budget_tracker: false,
    };

    let planName = "";

    if (variantId === plans.HabitTracker.variantId) {
      activePlan = {
        habit_tracker: true,
        budget_tracker: false,
      };

      planName = "HABIT_TRACKER";
    }

    if (variantId === plans.BudgerTracker.variantId) {
      activePlan = {
        habit_tracker: false,
        budget_tracker: true,
      };

      planName = "BUDGET_TRACKER";
    }

    if (variantId === plans.CombinedTracker.variantId) {
      activePlan = {
        habit_tracker: true,
        budget_tracker: true,
      };

      planName = "COMPLETE_BUNDLE";
    }

    // FIND USER
    const user = await prisma.user.findUnique({
      where: {
        id: userID,
      },
    });

    if (!user) {
      return Response.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // UPDATE USER ACCESS
    await prisma.user.update({
      where: {
        id: userID,
      },
      data: {
        access: activePlan,
      },
    });

    // STORE TRANSACTION
    await prisma.transaction.create({
      data: {
        userId: user.id,
        shopifyOrderId,
        planName,
        variantId: BigInt(variantId),
        amount: totalPrice,
        currency,
        paymentStatus,
        customerEmail: user.email,
        rawPayload: body as any,
      },
    });

    console.log("USER UPDATED");

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    await prisma.shopifyWebhookLog.create({
      data: {
        success: false,
        error: JSON.stringify(error),
        payload: { topic, webhookId, shopDomain, triggeredAt },
      },
    });

    return Response.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}
