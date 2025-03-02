// app/(root)/home/page.tsx
import React from 'react';
import { BentoGridHome } from '@/components/bento/bentodemo';
import ProtectedRoute from '@/components/dashboard/ProtectedRoute';

const HomePage = () => {
  return (
    <ProtectedRoute>
      <div className="w-full h-full">
        <BentoGridHome />
      </div>
    </ProtectedRoute>
  );
};

export default HomePage;
