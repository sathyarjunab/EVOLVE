import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullHabitState } from "@/util/habitHelper";
import z from "zod";
import { TimeOfDay } from "@/app/generated/prisma/enums";

export async function PUT(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const parsedBody = z.object({
            id: z.string().uuid(),
            name: z.string().min(1),
            icon: z.string().min(1),
            time: z.nativeEnum(TimeOfDay)
        }).safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid body" }, { status: 400 });
        }

        const { id, name, icon, time } = parsedBody.data;

        await prisma.habit.updateMany({
            where: { id, userId: user.id },
            data: {
                name,
                icon,
                timeOfDay: time
            }
        });

        const state = await getFullHabitState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
