import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullBudgetState } from "@/util/budgetHelper";
import z from "zod";

const createSchema = z.object({
    name: z.string().min(1).max(80),
    amount: z.number().positive(),
    dueDay: z.number().int().min(1).max(31),
    category: z.string().max(60),
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

        await prisma.fixedDue.create({
            data: {
                userId: user.id,
                name: parsed.data.name,
                amount: parsed.data.amount,
                dueDay: parsed.data.dueDay,
                category: parsed.data.category,
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

        await prisma.fixedDue.updateMany({
            where: { id: parsed.data.id, userId: user.id },
            data: {
                name: parsed.data.name,
                amount: parsed.data.amount,
                dueDay: parsed.data.dueDay,
                category: parsed.data.category,
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

        // Soft delete: isActive = false
        await prisma.fixedDue.updateMany({
            where: { id: parsed.data.id, userId: user.id },
            data: { isActive: false },
        });

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
