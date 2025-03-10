import React from 'react';
import { Orders } from '@/components/order/Orders';
import ErrorBoundary from '@/components/toaster/toaster';
const page = () => {
  return (
    <div className="w-full h-full">
      <ErrorBoundary>
        <Orders />
      </ErrorBoundary>
    </div>
  );
};

export default page;
