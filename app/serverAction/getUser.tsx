"use server";

import { prisma } from "@/prisma/prisma";
import { AppError } from "@/util/appError";
import { getUser } from "@/util/serverAuthHelper";
import { cookies } from "next/headers";
import { UserModel } from "../generated/prisma/models";

export type passwordlessUser = Omit<UserModel, "password"> & {
  password?: string;
};

type GetProfileReturnType =
  | { success: false; data: string }
  | { success: true; data: passwordlessUser };

export default async function getProfile(): Promise<GetProfileReturnType> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      throw new AppError("User not found", 404);
    }

    const user = await getUser();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const profile: passwordlessUser | null = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!profile) {
      throw new AppError("User not found", 404);
    }
    delete profile.password;
    return { success: true, data: profile };
  } catch (err) {
    if (err instanceof AppError) {
      return {
        success: false,
        data: err.message,
      };
    }
    return {
      success: false,
      data: "Something went wrong",
    };
  }
}
