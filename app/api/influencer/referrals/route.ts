import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { z } from "zod";

// Query params for the influencer's referral list
const referralsQuerySchema = z.object({
  search: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ─── GET /api/influencer/referrals ───────────────────────────────
// Returns the list of users referred by the logged-in influencer (the buyers
// mapped to them), paginated + searchable, plus an earnings summary.
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const sessionUser = await getUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify the caller is an influencer
    const influencer = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { userType: true, influencerShare: true },
    });
    if (!influencer || influencer.userType !== "INFLUENCER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Validate query params
    const params = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parsed = referralsQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 },
      );
    }
    const { search, page, limit } = parsed.data;

    // 4. Build the where filter — this influencer's mappings, optional search on
    //    the referred user's name/email.
    const where: any = { influencerId: sessionUser.id };
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // 5. Fetch page, total count, and the overall earnings aggregate together.
    //    The aggregates are computed over ALL referrals (no search filter) so the
    //    summary cards stay stable while the user searches/paginates the list.
    const summaryWhere = { influencerId: sessionUser.id };
    const [mappings, totalCount, aggregate] = await Promise.all([
      prisma.influencerUserMapping.findMany({
        where,
        select: {
          id: true,
          influencerEarnings: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.influencerUserMapping.count({ where }),
      prisma.influencerUserMapping.aggregate({
        where: summaryWhere,
        _sum: { influencerEarnings: true },
        _count: true,
      }),
    ]);

    const data = mappings.map((m) => ({
      mappingId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      joinedAt: m.user.createdAt,
      referredAt: m.createdAt,
      earnings: m.influencerEarnings,
    }));

    return NextResponse.json({
      success: true,
      data,
      summary: {
        totalEarnings: aggregate._sum.influencerEarnings ?? 0,
        totalReferrals: aggregate._count,
        sharePercent: influencer.influencerShare,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
