import { createContext, useContext, useMemo, useState } from "react";
import { UserModel } from "./generated/prisma/models";

const AuthContext = createContext({
    user: {} as UserModel | null,
    token: null as string | null,
})

export const AuthProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const [user, setUser] = useState<UserModel | null>(null)
    const [token, setToken] = useState<string | null>(null)

    const authValue = useMemo(() => ({ user, token }), [user, token])

    return <AuthContext.Provider value={authValue} >{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)