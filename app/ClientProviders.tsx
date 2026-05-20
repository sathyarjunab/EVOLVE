'use client';

import { AuthProvider } from "./AuthContextProvider";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster />
      <AuthProvider>
        {children}
      </AuthProvider>
    </>
  );
}
