import { prisma } from "@/prisma/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const toDateStr = (d: Date) => dayjs.utc(d).format("YYYY-MM-DD");

export async function getFullBudgetState(userId: string) {
    // Upsert settings so the row always exists
    const settings = await prisma.budgetSettings.upsert({
        where: { userId },
        create: { userId },
        update: {},
    });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
    });

    const incomeSources = await prisma.incomeSource.findMany({
        where: { userId, isActive: true },
        orderBy: { sortOrder: "asc" },
    });

    const transactions = await prisma.budgetTransaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
    });

    const dues = await prisma.fixedDue.findMany({
        where: { userId, isActive: true },
        include: { paidLogs: true },
        orderBy: { dueDay: "asc" },
    });

    const savingsGoals = await prisma.savingsGoal.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: "asc" },
    });

    return {
        userName: user?.name || "User",
        currency: settings.currency,
        tutorialSeen: settings.tutorialSeen,
        bankBalance:
            settings.bankBalance !== null
                ? parseFloat(settings.bankBalance.toString())
                : null,
        bankNote: settings.bankNote,
        bankBalUpdated: settings.bankBalUpdated
            ? toDateStr(settings.bankBalUpdated)
            : null,
        incomeSources: incomeSources.map((s) => ({
            id: s.id,
            name: s.name,
            amount: parseFloat(s.amount.toString()),
            emoji: s.emoji,
            type: s.type,
        })),
        transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type,
            name: t.name,
            amount: parseFloat(t.amount.toString()),
            category: t.category,
            date: toDateStr(t.date),
            note: t.note || "",
            goalId: t.goalId || null,
        })),
        dues: dues.map((d) => ({
            id: d.id,
            name: d.name,
            amount: parseFloat(d.amount.toString()),
            dueDay: d.dueDay,
            category: d.category,
            emoji: d.emoji,
            paidMonths: d.paidLogs.map((pl) => pl.periodKey),
        })),
        savingsGoals: savingsGoals.map((g) => ({
            id: g.id,
            name: g.name,
            target: parseFloat(g.targetAmount.toString()),
            current: parseFloat(g.currentAmount.toString()),
            emoji: g.emoji,
        })),
    };
}

/** Recomputes currentAmount for a goal from its savings transactions. */
export async function recalculateGoalAmount(goalId: string) {
    const txs = await prisma.budgetTransaction.findMany({
        where: { goalId, type: "savings" },
    });
    const total = txs.reduce(
        (sum, t) => sum + parseFloat(t.amount.toString()),
        0
    );
    await prisma.savingsGoal.update({
        where: { id: goalId },
        data: { currentAmount: total },
    });
}
