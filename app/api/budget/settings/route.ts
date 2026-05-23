import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullBudgetState } from "@/util/budgetHelper";
import z from "zod";

const schema = z.object({
    currency: z.string().max(5).optional(),
    tutorialSeen: z.boolean().optional(),
    bankBalance: z.number().min(0).nullable().optional(),
    bankNote: z.string().max(200).optional(),
});

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const data: Record<string, any> = {};
        if (parsed.data.currency !== undefined) data.currency = parsed.data.currency;
        if (parsed.data.tutorialSeen !== undefined)
            data.tutorialSeen = parsed.data.tutorialSeen;
        if (parsed.data.bankBalance !== undefined) {
            data.bankBalance = parsed.data.bankBalance;
            data.bankBalUpdated = new Date();
        }
        if (parsed.data.bankNote !== undefined) data.bankNote = parsed.data.bankNote;

        await prisma.budgetSettings.upsert({
            where: { userId: user.id },
            create: { userId: user.id, ...data },
            update: data,
        });

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
