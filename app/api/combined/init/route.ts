import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { getFullHabitState } from "@/util/habitHelper";
import { getFullBudgetState } from "@/util/budgetHelper";

export async function GET(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [hState, bState] = await Promise.all([
            getFullHabitState(user.id),
            getFullBudgetState(user.id),
        ]);

        return NextResponse.json({ success: true, hState, bState });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
