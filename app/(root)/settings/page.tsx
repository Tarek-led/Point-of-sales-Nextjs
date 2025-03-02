// app/(root)/settings/page.tsx
import React from 'react';
import { Setting } from '@/components/setting/setting';
import ProtectedRoute from '@/components/dashboard/ProtectedRoute';

const SettingsPage = () => {
  return (
    <ProtectedRoute>
      <div className="w-full h-full">
        <Setting />
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
