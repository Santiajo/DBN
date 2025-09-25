// src/app/dashboard/layout.tsx
'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const pageTitle = "Inicio";

  return (
    <div className="flex h-screen bg-stone-100">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      <div className="flex-1 flex flex-col relative"> {/* Añadimos 'relative' como contexto */}
        {/* Pasamos el estado de la sidebar a la Navbar */}
        <Navbar pageTitle={pageTitle} isSidebarCollapsed={isSidebarCollapsed} />

        <main className="flex-1 p-8 overflow-y-auto pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}