"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { GroupProvider } from "@/components/group-provider";
import BottomNav from "@/components/bottom-nav";

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <GroupProvider>
      <div className="pb-20 min-h-screen">
        <header className="bg-red-600 text-white px-4 py-3 sticky top-0 z-40">
          <h1 className="text-lg font-bold">Home Stock</h1>
        </header>
        <main className="max-w-lg mx-auto p-4">{children}</main>
        <BottomNav />
      </div>
    </GroupProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}