'use client';
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="dashboard-shell flex h-screen bg-gray-50 overflow-hidden print:block print:h-auto print:min-h-0 print:overflow-visible print:bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
          <Header />
          <main className="dashboard-content flex-1 overflow-y-auto print:block print:h-auto print:overflow-visible">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
