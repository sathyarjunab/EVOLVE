import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullHabitState } from "@/util/habitHelper";
import z from "zod";

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const parsedBody = z.object({
            fromId: z.string().uuid(),
            toId: z.string().uuid()
        }).safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid body" }, { status: 400 });
        }

        const { fromId, toId } = parsedBody.data;

        // Fetch both habits to swap their sortOrder
        const habits = await prisma.habit.findMany({
            where: {
                id: {
                    in: [fromId, toId]
                }, userId: user.id
            }
        });
        // const toHabit = await prisma.habit.findFirst({ where: { id: toId, userId: user.id } });

        if (!habits || habits.length !== 2) {
            return NextResponse.json({ error: "Habits not found" }, { status: 404 });
        }

        const fromHabit = habits.find(h => h.id === fromId);
        const toHabit = habits.find(h => h.id === toId);

        if (fromHabit && toHabit) {
            // Swap sort orders
            await prisma.$transaction([
                prisma.habit.update({
                    where: {
                        id: fromId,
                    },
                    data: {
                        sortOrder: toHabit.sortOrder,
                    },
                }),
                prisma.habit.update({
                    where: {
                        id: toId,
                    },
                    data: {
                        sortOrder: fromHabit.sortOrder,
                    },
                }),
            ])
        }

        const state = await getFullHabitState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
