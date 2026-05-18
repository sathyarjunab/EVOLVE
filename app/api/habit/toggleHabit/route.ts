import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullHabitState, recalculateDailySummary, recalculateTrackerStats, getLocalTodayStr } from "@/util/habitHelper";
import z from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsedBody = z.object({
            id: z.string().uuid(),
            done: z.boolean()
        }).safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid body" }, { status: 400 });
        }

        const { id, done } = parsedBody.data;

        const tz = user.timezone || "UTC";
        const todayStr = getLocalTodayStr(tz);
        const parsedDate = dayjs.utc(todayStr).toDate();
        const now = dayjs().toDate();

        if (done) {
            await prisma.habitLog.upsert({
                where: {
                    uq_habit_log_date: {
                        habitId: id,
                        logDate: parsedDate
                    }
                },
                update: {
                    completedAt: now
                },
                create: {
                    habitId: id,
                    userId: user.id,
                    logDate: parsedDate,
                    completedAt: now
                }
            });
        } else {
            await prisma.habitLog.deleteMany({
                where: {
                    habitId: id,
                    userId: user.id,
                    logDate: parsedDate
                }
            });
        }

        await recalculateDailySummary(user.id, todayStr);
        await recalculateTrackerStats(user.id);

        const state = await getFullHabitState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
