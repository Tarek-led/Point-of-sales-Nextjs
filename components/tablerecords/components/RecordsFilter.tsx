// components/RecordsFilter.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function RecordsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    // Keep existing search query if available
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    // Optionally keep page number, or reset to page 1
    params.set('page', '1');

    router.push(`/records?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 items-center">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="p-2 border rounded"
        placeholder="Start Date"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="p-2 border rounded"
        placeholder="End Date"
      />
      <button
        onClick={handleFilter}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Filter
      </button>
    </div>
  );
}
