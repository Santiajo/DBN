'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PersonajeProvider } from '@/context/PersonajeContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const pageTitle = "Inicio";
  const router = useRouter();
  const { user } = useAuth();

  // 🚨 Si no hay usuario, redirigir al login
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  return (
    <div className="flex h-screen bg-stone-100">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div className="flex-1 flex flex-col relative">
        <Navbar pageTitle={pageTitle} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 p-8 overflow-y-auto pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PersonajeProvider>
        <DashboardContent>{children}</DashboardContent>
      </PersonajeProvider>
    </AuthProvider>
  );
}
