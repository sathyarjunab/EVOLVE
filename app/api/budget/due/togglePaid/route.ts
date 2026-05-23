import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullBudgetState } from "@/util/budgetHelper";
import z from "zod";

const schema = z.object({
    dueId: z.string().uuid(),
    periodKey: z.string().regex(/^\d{4}-\d{2}$/),
    paid: z.boolean(),
});

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { dueId, periodKey, paid } = parsed.data;

        // Verify ownership
        const due = await prisma.fixedDue.findFirst({
            where: { id: dueId, userId: user.id },
        });
        if (!due)
            return NextResponse.json({ error: "Due not found" }, { status: 404 });

        if (paid) {
            // Upsert so double-taps are idempotent
            await prisma.duePaidLog.upsert({
                where: { dueId_periodKey: { dueId, periodKey } },
                create: { dueId, periodKey },
                update: {},
            });
        } else {
            await prisma.duePaidLog.deleteMany({ where: { dueId, periodKey } });
        }

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
