import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import * as jose from "jose";
import { UserModel } from "@/app/generated/prisma/models";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getUser() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function getToken(payload: Partial<UserModel>) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);

    return payload;
  } catch {
    return null;
  }
}
