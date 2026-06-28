import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { z } from "zod";

// Zod schema for query parameters validation
const usersQuerySchema = z.object({
  search: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const sessionUser = await getUser();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch full user to verify ADMIN role
    const adminUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { userType: true },
    });

    if (!adminUser || adminUser.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse and validate query parameters using Zod
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = usersQuerySchema.safeParse(params);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { search, page, limit } = parsed.data;

    // 4. Construct search filter
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // 5. Query total and users concurrently
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          access: true,
          createdAt: true,
          lastLogin: true,
          influencerType: true,
          influencerShare: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Zod schema for editing a user
const updateUserSchema = z.object({
  id: z.string().uuid(),
  userType: z.enum(["USER", "ADMIN", "INFLUENCER"]),
  influencerType: z.string().optional().default(""),
  influencerShare: z.coerce.number().min(0).max(100).optional().default(0),
}).superRefine((data, ctx) => {
  if (data.userType === "INFLUENCER") {
    if (!data.influencerType || data.influencerType.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Influencer platform type is required (e.g. YouTube, Instagram)",
        path: ["influencerType"],
      });
    }
    if (data.influencerShare <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Influencer share percentage must be greater than 0%",
        path: ["influencerShare"],
      });
    }
  }
});

export async function PUT(req: NextRequest) {
  try {
    // 1. Authenticate user
    const sessionUser = await getUser();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch full user to verify ADMIN role
    const adminUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { userType: true },
    });

    if (!adminUser || adminUser.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, userType, influencerType, influencerShare } = parsed.data;

    // 4. Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 5. Update user in the database
    const updated = await prisma.user.update({
      where: { id },
      data: {
        userType,
        influencerType: userType === "INFLUENCER" ? influencerType.trim() : "",
        influencerShare: userType === "INFLUENCER" ? influencerShare : 0.0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        influencerType: true,
        influencerShare: true,
        access: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
