import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/util/serverAuthHelper";
import { getFullBudgetState } from "@/util/budgetHelper";

export async function GET(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const state = await getFullBudgetState(user.id);
        return NextResponse.json({ success: true, state });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
