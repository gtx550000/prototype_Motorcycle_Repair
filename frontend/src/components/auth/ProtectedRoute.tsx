'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export const ProtectedRoute = ({ children, requireOwner = false }: { children: React.ReactNode, requireOwner?: boolean }) => {
  const { isAuthenticated, isLoading, isOwner } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && requireOwner && !isOwner) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, isOwner, requireOwner, router]);

  if (isLoading || !isAuthenticated || (requireOwner && !isOwner)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};
