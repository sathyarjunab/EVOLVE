import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { prisma } from "@/prisma/prisma";
import { getFullBudgetState } from "@/util/budgetHelper";
import z from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  amount: z.number().positive(),
  emoji: z.string().max(8),
  type: z.string().max(30).default("monthly"),
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

    const maxOrder = await prisma.incomeSource.aggregate({
      where: { userId: user.id, isActive: true },
      _max: { sortOrder: true },
    });

    await prisma.incomeSource.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        emoji: parsed.data.emoji,
        type: parsed.data.type,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    const state = await getFullBudgetState(user.id);
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    console.error("Income POST error:", error);
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

    await prisma.incomeSource.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: {
        name: parsed.data.name,
        amount: parsed.data.amount,
        emoji: parsed.data.emoji,
        type: parsed.data.type,
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

    // Soft delete
    await prisma.incomeSource.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { isActive: false },
    });

    const state = await getFullBudgetState(user.id);
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
