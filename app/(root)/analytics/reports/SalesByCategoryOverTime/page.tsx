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
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Sales by Category Report</h1>
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-lg">Start:</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 text-base"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold text-lg">End:</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 text-base"
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
          <p className="py-4 text-center">Loading data...</p>
        ) : error ? (
          <p className="py-4 text-center text-red-500">Error: {error}</p>
        ) : data ? (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-card border border-border rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="py-3 px-6 border-b border-border text-left">
                    Date
                  </th>
                  {data.series.map((s) => (
                    <th
                      key={s.name}
                      className="py-3 px-6 border-b border-border text-left"
                    >
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.days.map((day, dayIndex) => (
                  <tr key={day} className="hover:bg-muted">
                    <td className="py-3 px-6 border-b border-border">{day}</td>
                    {data.series.map((s) => (
                      <td key={s.name} className="py-3 px-6 border-b border-border">
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
    </div>
  );
};

export default SalesByCategoryReport;
