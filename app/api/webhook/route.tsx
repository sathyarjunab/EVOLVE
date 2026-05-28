import { prisma } from "@/prisma/prisma";
import { Access } from "@/proxy";
import { plans, ShopifyOrdersPaidWebhook } from "@/util/types";
import { sendMail } from "@/util/mailSender";
import { newAccountEmail } from "@/util/emailTemplates";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN ?? "https://scalenevolve.com";

/** Generates a cryptographically random human-readable password */
function generatePassword(length: number): string {
  // Omit visually ambiguous characters (0, O, I, l, 1)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function POST(req: Request) {
  const topic = req.headers.get("x-shopify-topic");
  const webhookId = req.headers.get("x-shopify-webhook-id");
  const shopDomain = req.headers.get("x-shopify-shop-domain");
  const triggeredAt = req.headers.get("x-shopify-triggered-at");

  // These are updated throughout the handler and written in the finally block,
  // guaranteeing exactly ONE ShopifyWebhookLog row per incoming request.
  const logPayload = { topic, webhookId, shopDomain, triggeredAt };
  let logSuccess = false;
  let logError: string | undefined;
  let logUserId: string | undefined;

  try {
    console.log("WEBHOOK CALLED");

    // RAW BODY — must be consumed before any JSON parsing
    const rawBody = await req.text();

    // ── HMAC VERIFICATION ────────────────────────────────────────────────────
    // Verify before parsing so we never process forged payloads.

    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    if (!hmacHeader) {
      logError = "Missing HMAC header";
      return Response.json({ error: "Missing HMAC header" }, { status: 200 });
    }

    const generatedHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET!)
      .update(rawBody, "utf8")
      .digest("base64");

    if (generatedHash !== hmacHeader) {
      logError = "Invalid webhook signature";
      return Response.json(
        { error: "Invalid webhook signature" },
        { status: 200 },
      );
    }

    // ── PARSE BODY ───────────────────────────────────────────────────────────

    const body: ShopifyOrdersPaidWebhook = JSON.parse(rawBody);

    // Only process paid orders — ignore refunds, pending, etc.
    if (body.financial_status !== "paid") {
      logSuccess = true;
      return Response.json({ success: true, ignored: true });
    }

    // ORDER ID
    const shopifyOrderId = String(body.id);

    // ── IDEMPOTENCY CHECK ────────────────────────────────────────────────────
    // If Shopify retries a webhook we already processed, return 200 immediately
    // so Shopify stops retrying.
    const existingTransaction = await prisma.transaction.findUnique({
      where: { shopifyOrderId },
    });
    if (existingTransaction) {
      logSuccess = true;
      return Response.json({ success: true, ignored: true });
    }

    // ── PLAN MAPPING ─────────────────────────────────────────────────────────

    const variantId = body.line_items?.[0]?.variant_id;
    const totalPrice = body.current_total_price;
    const currency = body.currency;

    // newAccess holds only the flags this purchase unlocks.
    // It is merged onto the user's existing access at write time so that
    // a second purchase never strips access the user already paid for.
    let planName = "";
    let newAccess: Partial<Access> = {};

    if (variantId === plans.HabitTracker.variantId) {
      newAccess = { habit_tracker: true };
      planName = "HABIT_TRACKER";
    } else if (variantId === plans.BudgetTracker.variantId) {
      newAccess = { budget_tracker: true };
      planName = "BUDGET_TRACKER";
    } else if (variantId === plans.CombinedTracker.variantId) {
      newAccess = { habit_tracker: true, budget_tracker: true };
      planName = "COMPLETE_BUNDLE";
    }

    if (!planName) {
      console.warn("Unknown variantId received in webhook:", variantId);
      logSuccess = true;
      return Response.json({ success: true, ignored: true });
    }

    // ── FIND OR CREATE USER ──────────────────────────────────────────────────

    const userId = body.note_attributes.find(
      ({ name }) => name === "userId",
    )?.value;

    let user: {
      id: string;
      name: string;
      email: string;
      access: unknown;
    } | null = null;

    // Tracks whether the user was created here so we skip the redundant update
    let isNewUser = false;

    if (userId) {
      // ── LOGGED-IN CHECKOUT: resolve by id ──────────────────────────────────
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        logError = `User not found for userId: ${userId}`;
        return Response.json({ error: "User not found" }, { status: 200 });
      }
    } else {
      // ── GUEST CHECKOUT: find by email, or create a new account ─────────────
      const customerEmail = body.email;
      if (!customerEmail) {
        logError = "No email address in Shopify order";
        return Response.json({ error: "No email in order" }, { status: 200 });
      }

      user = await prisma.user.findUnique({ where: { email: customerEmail } });

      if (!user) {
        isNewUser = true;

        const rawPassword = generatePassword(12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const name = customerEmail.split("@")[0];

        // Set the correct access flags at creation time
        const initialAccess: Access = {
          habit_tracker: newAccess.habit_tracker ?? false,
          budget_tracker: newAccess.budget_tracker ?? false,
        };

        user = await prisma.user.create({
          data: {
            name,
            email: customerEmail,
            password: hashedPassword,
            access: initialAccess,
          },
        });

        // Send welcome email with temporary credentials.
        // Fire-and-forget: a mail failure must NOT block the order from completing.
        sendMail({
          to: customerEmail,
          userName: name,
          subject: "Welcome to Evolve — Your account is ready",
          htmlBody: newAccountEmail(
            name,
            customerEmail,
            rawPassword,
            `${BASE_URL}/auth/login`,
          ),
        }).catch((err) => console.error("Failed to send welcome email:", err));
      }
    }

    // ── UPDATE ACCESS ────────────────────────────────────────────────────────
    // New users already have the correct access set at creation time.
    // Existing users (found by id or by email) need their access merged so
    // they keep everything they previously paid for.
    if (!isNewUser) {
      const mergedAccess: Access = {
        ...(user.access as Access),
        ...newAccess,
      };
      await prisma.user.update({
        where: { id: user.id },
        data: { access: mergedAccess },
      });
    }

    logUserId = user.id;

    // ── STORE TRANSACTION ────────────────────────────────────────────────────
    await prisma.transaction.create({
      data: {
        userId: user.id,
        shopifyOrderId,
        planName,
        variantId: BigInt(variantId),
        amount: totalPrice,
        currency,
        paymentStatus: body.financial_status,
        customerEmail: user.email,
        rawPayload: body as any,
      },
    });

    console.log("USER UPDATED");
    logSuccess = true;
    return Response.json({ success: true });
  } catch (error) {
    logError = JSON.stringify(error);
    return Response.json({ success: false }, { status: 200 });
  } finally {
    // ── SINGLE LOG PER REQUEST ───────────────────────────────────────────────
    // The finally block always executes regardless of which return path was
    // taken, so exactly one log row is written per incoming Shopify request.
    try {
      await prisma.shopifyWebhookLog.create({
        data: {
          success: logSuccess,
          ...(logError !== undefined ? { error: logError } : {}),
          ...(logUserId !== undefined ? { userId: logUserId } : {}),
          payload: logPayload,
        },
      });
    } catch (logErr) {
      // Log write failures must never mask the actual response.
      console.error("Failed to write webhook log:", logErr);
    }
  }
}
