import { TimeOfDay } from "@/app/generated/prisma/enums";
import { prisma } from "@/prisma/prisma";
import { getFullHabitState, recalculateDailySummary, getLocalTodayStr } from "@/util/habitHelper";
import { getUser } from "@/util/serverAuthHelper";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const result = z.object({
            name: z.string(),
            icon: z.string(),
            time: z.nativeEnum(TimeOfDay)
        }).safeParse({ ...body, time: body.time.toLowerCase() });

        if (!result.success) {
            return NextResponse.json({ error: result.error.message }, { status: 400 });
        }

        const { name, icon, time } = result.data;

        const maxOrderHabit = await prisma.habit.findFirst({
            where: { userId: user.id },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true }
        });

        const newOrder = maxOrderHabit ? maxOrderHabit.sortOrder + 1 : 1;

        await prisma.habit.create({
            data: {
                userId: user.id,
                name,
                icon,
                timeOfDay: time,
                sortOrder: newOrder
            }
        });

        const tz = user.timezone || "UTC";
        const todayStr = getLocalTodayStr(tz);
        await recalculateDailySummary(user.id, todayStr);

        const state = await getFullHabitState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
