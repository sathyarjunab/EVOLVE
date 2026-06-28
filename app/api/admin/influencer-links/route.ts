import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { z } from "zod";

const getLinksSchema = z.object({
  influencerId: z.string().uuid(),
});

const createLinkSchema = z.object({
  influencerId: z.string().uuid(),
  link: z.url().max(500),
});

const deleteLinkSchema = z.object({
  id: z.string().uuid(),
});

// Helper to check admin access
async function checkAdminAccess(): Promise<
  { error: string; status: number; sessionUser?: undefined } |
  { sessionUser: NonNullable<Awaited<ReturnType<typeof getUser>>>; error?: undefined; status?: undefined }
> {
  const sessionUser = await getUser();
  if (!sessionUser || !sessionUser.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { userType: true },
  });

  if (!adminUser || adminUser.userType !== "ADMIN") {
    return { error: "Forbidden", status: 403 };
  }

  return { sessionUser };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const influencerId = searchParams.get("influencerId");

    const parsed = getLinksSchema.safeParse({ influencerId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid influencer ID" },
        { status: 400 }
      );
    }

    const links = await prisma.influencerLink.findMany({
      where: { influencerId: parsed.data.influencerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: links,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const parsed = createLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { influencerId, link } = parsed.data;

    // Verify the influencer exists and has INFLUENCER role
    const influencer = await prisma.user.findUnique({
      where: { id: influencerId },
      select: { userType: true },
    });

    if (!influencer) {
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }

    if (influencer.userType !== "INFLUENCER") {
      return NextResponse.json({ error: "User is not an influencer" }, { status: 400 });
    }

    // Check link uniqueness
    const existing = await prisma.influencerLink.findUnique({
      where: { link },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This referral link is already assigned to an influencer" },
        { status: 400 }
      );
    }

    const newLink = await prisma.influencerLink.create({
      data: { influencerId, link },
    });

    return NextResponse.json({
      success: true,
      data: newLink,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const parsed = deleteLinkSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid link ID" },
        { status: 400 }
      );
    }

    const targetLink = await prisma.influencerLink.findUnique({
      where: { id: parsed.data.id },
    });

    if (!targetLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await prisma.influencerLink.delete({
      where: { id: parsed.data.id },
    });

    return NextResponse.json({
      success: true,
      message: "Link deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
