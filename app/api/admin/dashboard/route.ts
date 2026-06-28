import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";

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

    // 3. Query all users (createdAt, access, userType) to compute counts and registration splits in memory
    const users = await prisma.user.findMany({
      select: {
        createdAt: true,
        access: true,
        userType: true,
      },
    });

    const totalUsers = users.length;
    const influencersCount = users.filter((u) => u.userType === "INFLUENCER").length;

    // Filter registrations in the last 7 days for users
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = users.filter((u) => u.createdAt >= sevenDaysAgo).length;

    // Filter influencers registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newInfluencersThisMonth = users.filter(
      (u) => u.userType === "INFLUENCER" && u.createdAt >= thirtyDaysAgo
    ).length;

    // Compute module access split
    let habitTrackerCount = 0;
    let moneyTrackerCount = 0;
    users.forEach((u) => {
      let accessObj: any = {};
      if (u.access) {
        if (typeof u.access === "string") {
          try {
            accessObj = JSON.parse(u.access);
          } catch {}
        } else {
          accessObj = u.access;
        }
      }
      if (accessObj?.habit_tracker) habitTrackerCount++;
      if (accessObj?.money_tracker) moneyTrackerCount++;
    });

    const habitTrackerPct = totalUsers > 0 ? Math.round((habitTrackerCount / totalUsers) * 100) : 0;
    const moneyTrackerPct = totalUsers > 0 ? Math.round((moneyTrackerCount / totalUsers) * 100) : 0;

    // 4. Query total influencer payouts (sum of influencerEarnings from InfluencerUserMapping)
    const influencerPayoutsSum = await prisma.influencerUserMapping.aggregate({
      _sum: {
        influencerEarnings: true,
      },
    });
    const totalInfluencerPayouts = Number(influencerPayoutsSum._sum.influencerEarnings || 0);

    // 5. Query estimated revenue (sum of amount from Transaction)
    const revenueSum = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
    });
    const estRevenue = Number(revenueSum._sum.amount || 0);

    // 6. Query weekly transaction growth to show a simple count/change indicator
    const newTransactionsThisMonth = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 7. Calculate monthly registrations for the last 6 months
    const last6Months = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - idx));
      return {
        name: d.toLocaleString("en-US", { month: "short" }),
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        count: 0,
      };
    });

    users.forEach((user) => {
      const d = new Date(user.createdAt);
      const match = last6Months.find(
        (m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear()
      );
      if (match) {
        match.count++;
      }
    });

    // Clean monthly data
    const registrations = last6Months.map(({ name, count }) => ({
      name,
      count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        newUsersThisWeek,
        influencersCount,
        newInfluencersThisMonth,
        totalInfluencerPayouts,
        estRevenue,
        newTransactionsThisMonth,
        productSplit: {
          habitTrackerPct,
          moneyTrackerPct,
        },
        registrations,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
