"use server";

import { prisma } from "@/prisma/prisma";
import { AppError } from "@/util/appError";
import { getToken } from "@/util/serverAuthHelper";
import { loginSchema } from "@/util/validator";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { UserModel } from "../generated/prisma/models";

export default async function login(email: string, password: string) {
  try {
    const data = await loginSchema.parseAsync({ email, password });
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        access: true,
      },
    });

    if (!user) throw new AppError("Invalid credentials", 401);

    const isSame = await bcrypt.compare(data.password, user.password);

    const { password: _, ...userWithoutPassword } = user;

    if (!isSame) throw new AppError("Invalid credentials", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = await getToken(user);

    (await cookies()).set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user: userWithoutPassword };
  } catch (err) {
    if (err instanceof AppError) {
      return {
        success: false,
        message: err.message,
      };
    }
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}
