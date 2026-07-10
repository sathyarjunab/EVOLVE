import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { sendMail } from "@/util/mailSender";
import { newAccountEmail } from "@/util/emailTemplates";
import { generatePassword } from "@/util/passwordGenerator";
import bcrypt from "bcryptjs";
import { z } from "zod";

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN ?? "https://scalenevolve.com";

// Zod schema for query parameters validation
const usersQuerySchema = z.object({
  search: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z
    .enum(["USER", "ADMIN", "INFLUENCER", "ALL"])
    .optional()
    .default("ALL"),
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
        { status: 400 },
      );
    }

    const { search, page, limit, type } = parsed.data;

    // 4. Construct search filter
    const where: any = {};
    if (type && type !== "ALL") {
      where.userType = type;
    }
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
      { status: 500 },
    );
  }
}

// Zod schema for creating a user.
// `tracker` maps to the access JSON: which trackers the new user can reach.
const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(80),
  email: z
    .string()
    .email("Invalid email address")
    .transform((email) => email.toLowerCase().trim()),
  tracker: z.enum(["habit", "money", "combined"]),
  timezone: z.string().optional(),
});

// Preset -> access flags. "combined" grants both trackers.
function accessFromPreset(tracker: "habit" | "money" | "combined") {
  return {
    habit_tracker: tracker === "habit" || tracker === "combined",
    money_tracker: tracker === "money" || tracker === "combined",
  };
}

export async function POST(req: NextRequest) {
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
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, tracker, timezone } = parsed.data;

    // 4. Reject duplicate emails
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // 5. Generate a temporary password and create the account
    const rawPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const created = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        timezone: timezone || "UTC",
        access: accessFromPreset(tracker),
        userType: "USER",
        influencerType: "",
        influencerShare: 0.0,
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

    // 6. Email the credentials. A mail failure must NOT lose the account —
    // we still return success and flag emailSent:false so the admin can
    // share the credentials manually or resend.
    let emailSent = true;
    try {
      await sendMail({
        to: created.email,
        userName: created.name,
        subject: "Welcome to Evolve — Your account is ready",
        htmlBody: newAccountEmail(
          created.name,
          created.email,
          rawPassword,
          `${BASE_URL}/auth/login`,
        ),
      });
    } catch (mailErr) {
      emailSent = false;
      console.error("Failed to send new-account email:", mailErr);
    }

    return NextResponse.json({
      success: true,
      data: created,
      emailSent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Zod schema for editing a user
const updateUserSchema = z
  .object({
    id: z.string().uuid(),
    userType: z.enum(["USER", "ADMIN", "INFLUENCER"]),
    influencerType: z.string().optional().default(""),
    influencerShare: z.coerce.number().min(0).max(100).optional().default(0),
  })
  .superRefine((data, ctx) => {
    if (data.userType === "INFLUENCER") {
      if (!data.influencerType || data.influencerType.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Influencer platform type is required (e.g. YouTube, Instagram)",
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
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
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
      { status: 500 },
    );
  }
}

// Zod schema for deleting a user (id supplied as a query parameter).
const deleteUserSchema = z.object({
  id: z.string().uuid("Invalid user id"),
});

export async function DELETE(req: NextRequest) {
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

    // 3. Parse and validate the target id
    const url = new URL(req.url);
    const parsed = deleteUserSchema.safeParse({ id: url.searchParams.get("id") });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { id } = parsed.data;

    // 4. An admin must not delete their own account (would lock them out).
    if (id === sessionUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 },
      );
    }

    // 5. Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 6. Delete the user. Most relations cascade at the DB level, but
    // Transaction has no cascade rule (defaults to Restrict), so we remove
    // the user's order/transaction rows first in the same DB transaction to
    // avoid a foreign-key violation. Shopify webhook logs are set null.
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
