import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { z } from "zod";

// ─── Zod schemas ────────────────────────────────────────────────
const getCodesSchema = z.object({
  influencerId: z.string().uuid(),
});

const createCodeSchema = z
  .object({
    influencerId: z.string().uuid(),
    // code is optional — if omitted, we auto-generate one
    code: z
      .string()
      .max(100)
      .regex(/^[A-Z0-9_-]+$/i, "Code may only contain letters, numbers, hyphens and underscores")
      .optional(),
    couponCodeType: z.enum(["FLAT", "PERCENTAGE"], {
      error: "Coupon type must be FLAT or PERCENTAGE",
    }),
    discountValue: z
      .number({ error: "Discount value must be a number" })
      .positive("Discount value must be greater than 0"),
  })
  .refine(
    (data) => data.couponCodeType !== "PERCENTAGE" || data.discountValue <= 100,
    {
      path: ["discountValue"],
      message: "Percentage discount cannot exceed 100",
    }
  );

const deleteCodeSchema = z.object({
  id: z.string().uuid(),
});

// ─── Auto-generate a coupon code ─────────────────────────────────
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment(4)}-${segment(4)}-${segment(4)}`;
}

// ─── Admin guard ─────────────────────────────────────────────────
async function requireAdmin() {
  const sessionUser = await getUser();
  if (!sessionUser?.id) return { error: "Unauthorized", status: 401 as const };

  const adminUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { userType: true },
  });

  if (adminUser?.userType !== "ADMIN") return { error: "Forbidden", status: 403 as const };
  return { sessionUser };
}

// ─── GET /api/admin/influencer-links ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const influencerId = new URL(req.url).searchParams.get("influencerId");
    const parsed = getCodesSchema.safeParse({ influencerId });
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid influencer ID" }, { status: 400 });

    const codes = await prisma.influencerLink.findMany({
      where: { influencerId: parsed.data.influencerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: codes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}

// ─── POST /api/admin/influencer-links ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json();
    const parsed = createCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { influencerId, couponCodeType, discountValue } = parsed.data;

    // Verify influencer exists
    const influencer = await prisma.user.findUnique({
      where: { id: influencerId },
      select: { userType: true },
    });
    if (!influencer) return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    if (influencer.userType !== "INFLUENCER")
      return NextResponse.json({ error: "User is not an influencer" }, { status: 400 });

    // Resolve the code — use the provided one or auto-generate a unique one
    let code: string;
    if (parsed.data.code) {
      code = parsed.data.code.trim().toUpperCase();

      // Uniqueness check for a user-supplied code
      const existing = await prisma.influencerLink.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json(
          {
            error: `Coupon code "${code}" is already in use. Please choose a different code.`,
            code: "DUPLICATE_CODE",
          },
          { status: 409 }
        );
      }
    } else {
      // Auto-generate — try up to 3 times to land on a code that doesn't collide
      const MAX_ATTEMPTS = 3;
      let candidate: string | null = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const generated = generateCode();
        const existing = await prisma.influencerLink.findUnique({ where: { code: generated } });
        if (!existing) {
          candidate = generated;
          break;
        }
      }

      if (!candidate) {
        return NextResponse.json(
          {
            error: "Could not generate a unique coupon code. Please try again.",
            code: "CODE_GENERATION_FAILED",
          },
          { status: 409 }
        );
      }

      code = candidate;
    }

    const newCode = await prisma.influencerLink.create({
      data: { influencerId, code, couponCodeType, discountValue },
    });

    return NextResponse.json({ success: true, data: newCode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/influencer-links?id=... ───────────────────
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const id = new URL(req.url).searchParams.get("id");
    const parsed = deleteCodeSchema.safeParse({ id });
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });

    const target = await prisma.influencerLink.findUnique({ where: { id: parsed.data.id } });
    if (!target) return NextResponse.json({ error: "Coupon code not found" }, { status: 404 });

    await prisma.influencerLink.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ success: true, message: "Coupon code deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
