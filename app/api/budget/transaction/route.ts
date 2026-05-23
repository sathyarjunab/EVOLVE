import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullBudgetState, recalculateGoalAmount } from "@/util/budgetHelper";
import z from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const TX_TYPES = ["income", "expense", "savings"] as const;

const createSchema = z.object({
    type: z.enum(TX_TYPES),
    name: z.string().min(1).max(120),
    amount: z.number().positive(),
    category: z.string().max(60),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().max(300).optional().default(""),
    goalId: z.string().uuid().nullable().optional(),
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

        await prisma.budgetTransaction.create({
            data: {
                userId: user.id,
                type: parsed.data.type,
                name: parsed.data.name,
                amount: parsed.data.amount,
                category: parsed.data.category,
                date: dayjs.utc(parsed.data.date).toDate(),
                note: parsed.data.note || null,
                goalId: parsed.data.goalId || null,
            },
        });

        if (parsed.data.type === "savings" && parsed.data.goalId) {
            await recalculateGoalAmount(parsed.data.goalId);
        }

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

        // Fetch old transaction to get previous goalId
        const oldTx = await prisma.budgetTransaction.findFirst({
            where: { id: parsed.data.id, userId: user.id },
        });
        if (!oldTx)
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            );

        await prisma.budgetTransaction.updateMany({
            where: { id: parsed.data.id, userId: user.id },
            data: {
                type: parsed.data.type,
                name: parsed.data.name,
                amount: parsed.data.amount,
                category: parsed.data.category,
                date: dayjs.utc(parsed.data.date).toDate(),
                note: parsed.data.note || null,
                goalId: parsed.data.goalId || null,
            },
        });

        // Recalculate both old and new goal amounts if applicable
        const goalIds = new Set<string>();
        if (oldTx.goalId) goalIds.add(oldTx.goalId);
        if (parsed.data.goalId) goalIds.add(parsed.data.goalId);
        for (const gid of goalIds) {
            await recalculateGoalAmount(gid);
        }

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

        const tx = await prisma.budgetTransaction.findFirst({
            where: { id: parsed.data.id, userId: user.id },
        });
        if (!tx)
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            );

        await prisma.budgetTransaction.deleteMany({
            where: { id: parsed.data.id, userId: user.id },
        });

        if (tx.type === "savings" && tx.goalId) {
            await recalculateGoalAmount(tx.goalId);
        }

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
