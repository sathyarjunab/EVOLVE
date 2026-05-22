import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullHabitState, recalculateDailySummary, getLocalTodayStr } from "@/util/habitHelper";
import z from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id } = body;
        const habitId = z.string().uuid().safeParse(id);

        if (!habitId.success) {
            return NextResponse.json({ error: "Invalid habit id" }, { status: 400 });
        }

        // We can soft delete by setting isActive to false, or hard delete. Let's soft delete.
        await prisma.habit.updateMany({
            where: { id, userId: user.id },
            data: { isActive: false }
        });

        const tz = user.timezone || "UTC";
        const todayStr = getLocalTodayStr(tz);
        const parsedDate = dayjs.utc(todayStr).toDate();

        await prisma.habitLog.deleteMany({
            where: {
                habitId: id,
                userId: user.id,
                logDate: parsedDate
            }
        });

        await recalculateDailySummary(user.id, todayStr);

        const state = await getFullHabitState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
