import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullBudgetState } from "@/util/budgetHelper";
import z from "zod";

const createSchema = z.object({
    name: z.string().min(1).max(80),
    target: z.number().positive(),
    current: z.number().min(0).default(0),
    emoji: z.string().max(8),
});

const updateSchema = createSchema.extend({
    id: z.string().uuid(),
});

const deleteSchema = z.object({
    id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = createSchema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        // Ensure BudgetSettings row exists
        await prisma.budgetSettings.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
        });

        await prisma.savingsGoal.create({
            data: {
                userId: user.id,
                name: parsed.data.name,
                targetAmount: parsed.data.target,
                currentAmount: parsed.data.current,
                emoji: parsed.data.emoji,
            },
        });

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        // currentAmount is always derived from savings transactions — only allow
        // editing the goal's name, target, and emoji.
        await prisma.savingsGoal.updateMany({
            where: { id: parsed.data.id, userId: user.id },
            data: {
                name: parsed.data.name,
                targetAmount: parsed.data.target,
                emoji: parsed.data.emoji,
            },
        });

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = deleteSchema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        // Soft delete the goal
        await prisma.savingsGoal.updateMany({
            where: { id: parsed.data.id, userId: user.id },
            data: { isActive: false },
        });

        // Detach all savings transactions that pointed to this goal
        await prisma.budgetTransaction.updateMany({
            where: { goalId: parsed.data.id, userId: user.id },
            data: { goalId: null },
        });

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
