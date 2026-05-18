import { prisma } from "@/prisma/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const toStr = (d: Date) => dayjs.utc(d).format('YYYY-MM-DD');

export function getLocalTodayStr(tz: string = "UTC", baseDate: Date = new Date()): string {
    try {
        return dayjs(baseDate).tz(tz).format('YYYY-MM-DD');
    } catch (e) {
        return dayjs(baseDate).utc().format('YYYY-MM-DD');
    }
}

export async function getFullHabitState(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, timezone: true }
    });
    
    const tz = user?.timezone || "UTC";

    const habits = await prisma.habit.findMany({
        where: { userId, isActive: true },
        orderBy: { sortOrder: 'asc' }
    });

    const logs = await prisma.habitLog.findMany({
        where: { userId },
        orderBy: { logDate: 'desc' }
    });

    const todayStr = getLocalTodayStr(tz);

    const doneToday: Record<string, boolean> = {};
    const habitStreaks: Record<string, { streak: number, bestStreak: number }> = {};

    // Initialize streaks
    for (const h of habits) {
        habitStreaks[h.id] = { streak: 0, bestStreak: 0 };
    }

    // Calculate per-habit streaks
    // We group logs by habitId
    const logsByHabit = logs.reduce((acc, log) => {
        if (!acc[log.habitId]) acc[log.habitId] = [];
        acc[log.habitId].push(toStr(log.logDate));
        return acc;
    }, {} as Record<string, string[]>);

    // Loop to calculate the max streak and current streak for each habit
    for (const h of habits) {
        if (!logsByHabit[h.id]) continue;

        const hLogs = logsByHabit[h.id]; // Already sorted descending by date
        if (hLogs.includes(todayStr)) {
            doneToday[h.id] = true;
        }

        let maxStreak = 0;
        let tempStreak = 0;
        let lastDateObj: dayjs.Dayjs | null = null;

        // Loop through and obtain the max streak. 
        for (let i = 0; i < hLogs.length; i++) {
            const dateStr = hLogs[i];
            const d = dayjs.utc(dateStr);

            if (!lastDateObj) {
                tempStreak = 1;
            } else {
                const diffDays = lastDateObj.diff(d, 'day');
                if (diffDays === 1) {
                    // Means streak continues 
                    tempStreak++;
                } else if (diffDays > 1) {
                    // Means there was a break in the streak
                    tempStreak = 1;
                }
            }

            if (tempStreak > maxStreak) {
                // Update the maxstreak
                maxStreak = tempStreak;
            }
            lastDateObj = d;
        }

        // Current streak calculation
        let cStreak = 0;
        let checkDate = dayjs.utc(todayStr);

        // If not done today, start checking from yesterday
        if (!doneToday[h.id]) {
            checkDate = checkDate.subtract(1, 'day');
        }

        while (true) {
            const dateStr = checkDate.format('YYYY-MM-DD');
            if (hLogs.includes(dateStr)) {
                cStreak++;
                checkDate = checkDate.subtract(1, 'day');
            } else {
                break;
            }
        }

        habitStreaks[h.id] = { streak: cStreak, bestStreak: maxStreak };
    }

    const formattedHabits = habits.map(h => ({
        id: h.id,
        name: h.name,
        icon: h.icon,
        time: h.timeOfDay.charAt(0).toUpperCase() + h.timeOfDay.slice(1),
        streak: habitStreaks[h.id]?.streak || 0,
        bestStreak: habitStreaks[h.id]?.bestStreak || 0,
        order: h.sortOrder
    }));

    // Daily Summaries for history
    const summaries = await prisma.dailySummary.findMany({
        where: { userId }
    });

    const history: Record<string, { pct: number, done: number, total: number }> = {};
    for (const sum of summaries) {
        history[toStr(sum.summaryDate)] = {
            pct: sum.completionPct,
            done: sum.completedCount,
            total: sum.totalHabits
        };
    }

    // Tracker Stats
    const stats = await prisma.trackerStats.findUnique({
        where: {
            userId_trackerType: {
                userId,
                trackerType: 'habit_tracker'
            }
        }
    });

    let globalStreak = 0;
    let bestGlobalStreak = 0;
    let totalAllTime = 0;

    if (stats && stats.stats) {
        const s = stats.stats as any;
        globalStreak = s.globalStreak || 0;
        bestGlobalStreak = s.bestGlobalStreak || 0;
        totalAllTime = s.totalAllTime || 0;
    }

    return {
        habits: formattedHabits,
        history,
        doneToday,
        lastDate: todayStr,
        globalStreak,
        bestGlobalStreak,
        totalAllTime,
        userName: user?.name || "User"
    };
}

export async function recalculateDailySummary(userId: string, dateStr: string) {
    const parsedDate = dayjs.utc(dateStr).toDate(); // Normalizes time to 00:00 UTC

    const activeHabits = await prisma.habit.count({
        where: { userId, isActive: true }
    });

    const completedCount = await prisma.habitLog.count({
        where: {
            userId,
            logDate: parsedDate
        }
    });

    const pct = activeHabits > 0 ? Math.round((completedCount / activeHabits) * 100) : 0;

    await prisma.dailySummary.upsert({
        where: {
            userId_summaryDate: {
                userId,
                summaryDate: parsedDate
            }
        },
        update: {
            totalHabits: activeHabits,
            completedCount,
            completionPct: pct
        },
        create: {
            userId,
            summaryDate: parsedDate,
            totalHabits: activeHabits,
            completedCount,
            completionPct: pct
        }
    });
}

export async function recalculateTrackerStats(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true }
    });
    const tz = user?.timezone || "UTC";
    
    const summaries = await prisma.dailySummary.findMany({
        where: { userId },
        orderBy: { summaryDate: 'desc' }
    });

    let totalAllTime = 0;
    let currentGlobalStreak = 0;
    let bestGlobalStreak = 0;
    let tempGlobalStreak = 0;

    const todayStr = getLocalTodayStr(tz);

    let lastDateObj: dayjs.Dayjs | null = null;

    for (const sum of summaries) {
        totalAllTime += sum.completedCount;

        if (sum.completionPct > 0) {
            const sumDate = dayjs.utc(sum.summaryDate);
            if (!lastDateObj) {
                tempGlobalStreak = 1;
            } else {
                const diffDays = lastDateObj.diff(sumDate, 'day');
                if (diffDays === 1) {
                    tempGlobalStreak++;
                } else if (diffDays > 1) {
                    tempGlobalStreak = 1;
                }
            }
            if (tempGlobalStreak > bestGlobalStreak) {
                bestGlobalStreak = tempGlobalStreak;
            }
            lastDateObj = sumDate;
        }
    }

    // Current global streak
    let checkDate = dayjs.utc(todayStr);
    const sumMap = summaries.reduce((acc, s) => {
        acc[toStr(s.summaryDate)] = s;
        return acc;
    }, {} as Record<string, any>);

    if (!sumMap[todayStr] || sumMap[todayStr].completionPct === 0) {
        checkDate = checkDate.subtract(1, 'day'); // Start from yesterday
    }

    while (true) {
        const dateStr = checkDate.format('YYYY-MM-DD');
        if (sumMap[dateStr] && sumMap[dateStr].completionPct > 0) {
            currentGlobalStreak++;
            checkDate = checkDate.subtract(1, 'day');
        } else {
            break;
        }
    }

    // Fetch or create TrackerStats
    const stats = await prisma.trackerStats.findUnique({
        where: {
            userId_trackerType: {
                userId,
                trackerType: 'habit_tracker'
            }
        }
    });

    let currentStats = {};
    if (stats && stats.stats) {
        currentStats = typeof stats.stats === 'object' ? stats.stats : JSON.parse(stats.stats as string);
    }

    await prisma.trackerStats.upsert({
        where: {
            userId_trackerType: {
                userId,
                trackerType: 'habit_tracker'
            }
        },
        update: {
            stats: {
                ...currentStats,
                globalStreak: currentGlobalStreak,
                bestGlobalStreak,
                totalAllTime
            }
        },
        create: {
            userId,
            trackerType: 'habit_tracker',
            stats: {
                globalStreak: currentGlobalStreak,
                bestGlobalStreak,
                totalAllTime
            }
        }
    });
}
