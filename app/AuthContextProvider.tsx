"use client"

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserModel } from "./generated/prisma/models";
import getProfile from "./serverAction/getUser";
import logoutAction from "./serverAction/logout";

type AuthContextType = {
    user: UserModel | null
    refreshProfile: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const router = useRouter()

    const [user, setUser] = useState<UserModel | null>(null)

    const refreshProfile = async () => {
        try {
            const profile = await getProfile()
            if (!profile.success) throw new Error(profile.data)
            setUser(profile.data)
        } catch (err) {
            await logout()
        }
    }

    useEffect(() => {
        refreshProfile()
    }, []);


    const logout = async () => {
        await logoutAction()
        setUser(null)
        router.push("/login")
    }



    const authValue = useMemo(() => ({ user, refreshProfile, logout }), [user])

    return <AuthContext.Provider value={authValue} >{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error(
            "useAuth must be used within AuthProvider"
        )
    }

    return context
}