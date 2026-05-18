"use server"

import { cookies } from "next/headers"

export default async function logoutAction() {
    (await cookies()).delete('token')
}