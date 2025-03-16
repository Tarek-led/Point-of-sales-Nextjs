'use client';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';

interface Series {
  name: string;
  data: number[];
}

interface SalesByCategoryData {
  series: Series[];
  days: string[];
}

const SalesByCategoryReport: React.FC = () => {
  // Set default dates: last month until today.
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  const defaultEndDate = today.toISOString().split('T')[0];
  const defaultStartDate = lastMonth.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [data, setData] = useState<SalesByCategoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/sales-by-category?start=${startDate}&end=${endDate}`
      );
      // Expected response: { series: [...], days: [...] }
      setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-4 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sales by Category Report</h1>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="font-semibold">Start:</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-semibold">End:</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10"
          />
        </div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="py-4">Loading data...</p>
      ) : error ? (
        <p className="py-4 text-red-500">Error: {error}</p>
      ) : data ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-card border border-border rounded-md">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-border">Date</th>
                {data.series.map((s) => (
                  <th key={s.name} className="py-2 px-4 border-b border-border">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.days.map((day, dayIndex) => (
                <tr key={day} className="hover:bg-muted">
                  <td className="py-2 px-4 border-b border-border">{day}</td>
                  {data.series.map((s) => (
                    <td key={s.name} className="py-2 px-4 border-b border-border">
                      {s.data[dayIndex]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default SalesByCategoryReport;
