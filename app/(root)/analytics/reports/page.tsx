'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';

type CategoryReport = {
  category: string;
  totalQuantity: number;
  totalSales: number;
};

const DailyReportDetails: React.FC = () => {
  // Default date is today
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];

  const [date, setDate] = useState<string>(defaultDate);
  const [report, setReport] = useState<CategoryReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Call the API with the chosen date
        const res = await axios.get(`/api/reports?date=${date}`);
        // Our API returns { report: [...] }
        setReport(res.data.report);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [date]);

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Daily Sales Details</h1>
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
          <label className="font-semibold text-lg">Select Date:</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 text-base"
          />
        </div>
        {loading ? (
          <p className="py-4 text-center">Loading report...</p>
        ) : error ? (
          <p className="py-4 text-center text-red-500">Error: {error}</p>
        ) : report.length === 0 ? (
          <p className="py-4 text-center">No sales data for this day.</p>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-card border border-border rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="py-3 px-6 border-b border-border text-left">Category</th>
                  <th className="py-3 px-6 border-b border-border text-left">Total Quantity</th>
                  <th className="py-3 px-6 border-b border-border text-left">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.category} className="hover:bg-muted">
                    <td className="py-3 px-6 border-b border-border">{r.category}</td>
                    <td className="py-3 px-6 border-b border-border">{r.totalQuantity}</td>
                    <td className="py-3 px-6 border-b border-border">${r.totalSales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReportDetails;
