"use server"

import { prisma } from "@/prisma/prisma";
import { AppError } from "@/util/appError"
import { getUser } from "@/util/serverAuthHelper"
import { cookies } from "next/headers"
import { UserModel } from "../generated/prisma/models";

type GetProfileReturnType = { success: false, data: string } | { success: true, data: UserModel }

export default async function getProfile(): Promise<GetProfileReturnType> {
    try {
        const cookieStore = (await cookies());
        const token = cookieStore.get("token")?.value;
        if (!token) {
            throw new AppError("User not found", 404)
        }

        const user = await getUser()

        if (!user) {
            throw new AppError("User not found", 404)
        }

        const profile = await prisma.user.findUnique({
            where: {
                id: user.id
            }
        })

        if (!profile) {
            throw new AppError("User not found", 404)
        }
        return { success: true, data: profile }
    } catch (err) {
        if (err instanceof AppError) {
            return {
                success: false,
                data: err.message
            }
        }
        return {
            success: false,
            data: "Something went wrong"
        }
    }

}