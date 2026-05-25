"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserModel } from "./generated/prisma/models";
import getProfile from "./serverAction/getUser";
import logoutAction from "./serverAction/logout";

type AuthContextType = {
  user: UserModel | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const router = useRouter();

  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      if (!profile.success) {
        setUser(null);
        return;
      }
      setUser(profile.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const logout = async () => {
    await logoutAction();
    setUser(null);
    router.push("/landing");
  };

  const authValue = useMemo(() => ({ user, loading, refreshProfile, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
