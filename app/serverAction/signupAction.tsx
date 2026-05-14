"use server"

import { prisma } from "@/prisma/prisma"
import { AppError } from "@/util/appError"
import { getToken } from "@/util/serverAuthHelper"
import { signupSchema } from "@/util/validator"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export default async function signup(name: string, email: string, password: string) {
    try {
        const data = await signupSchema.parseAsync({ name, email, password })
        const user = await prisma.user.findUnique({
            where: {
                email: data.email,
            },
            select: {
                id: true,
                email: true,
                password: true,
                name: true
            }
        })

        if (user) throw new AppError("User already exists", 409)

        const hashedPassword = await bcrypt.hash(data.password, 10)

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword
            }
        })

        const token = await getToken(newUser);

        (await cookies()).set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        })
    } catch (err) {
        if (err instanceof AppError) {
            return {
                success: false,
                message: err.message
            }
        }
        return {
            success: false,
            message: "Something went wrong"
        }
    }

}