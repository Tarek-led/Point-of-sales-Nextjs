// components/ProtectedRoute.tsx
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast.error('Access denied. You do not have permission to view this page.');
      router.push('/'); // Redirect to homepage or another public page.
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    // Optionally render a loader or a blank state while checking.
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
