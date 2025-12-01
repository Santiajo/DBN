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

      <div className="flex-1 flex flex-col relative">
        <Navbar pageTitle={pageTitle} isSidebarCollapsed={isSidebarCollapsed} />

        <main className="flex-1 overflow-y-auto pt-18">
          {children}
        </main>
      </div>
    </div>
  );
}