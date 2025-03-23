'use client';
import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Modal from '@/components/graphModal/Modal';
import { Input } from '@/components/ui/input';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const today = new Date();
const lastMonth = new Date();
lastMonth.setMonth(today.getMonth() - 1);
const defaultEndDate = today.toISOString().split('T')[0];
const defaultStartDate = lastMonth.toISOString().split('T')[0];

interface CategorySeries {
  name: string;
  data: number[];
}

interface ChartState {
  series: CategorySeries[];
  options: ApexOptions;
  totalBySeries: { name: string; total: number }[];
}

const ChartCategory: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [totalBySeries, setTotalBySeries] = useState<{ name: string; total: number }[]>([]);

  const [state, setState] = useState<ChartState>({
    series: [],
    options: {
      chart: {
        type: 'donut',
        toolbar: { show: false },
      },
      colors: ['#3C50E0', '#6577F3', '#8FD0EF', '#0FADCF', '#80CAEE', '#4ADE80', '#F43F5E', '#FBBF24'],
      labels: [], // Always initialized as an array
      legend: { show: false, position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            background: 'transparent',
          },
        },
      },
      dataLabels: { enabled: false },
      responsive: [
        { breakpoint: 2600, options: { chart: { width: 380 } } },
        { breakpoint: 640, options: { chart: { width: 200 } } },
      ],
    },
    totalBySeries: [],
  });

  const calculateTotals = (seriesData: CategorySeries[]) => {
    return seriesData.map((serie) => ({
      name: serie.name,
      total: serie.data.reduce((sum, current) => sum + (Number.isFinite(current) ? current : 0), 0),
    }));
  };

  const fetchCategorySales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sales-by-category?start=${startDate}&end=${endDate}`);
      const { series } = response.data;

      const newTotalBySeries = series && Array.isArray(series) && series.length > 0 ? calculateTotals(series) : [];
      newTotalBySeries.sort((a, b) => b.total - a.total);
      setTotalBySeries(newTotalBySeries);

      const labels = newTotalBySeries.map((item) => item.name);
      setState((prev) => ({
        ...prev,
        series: series || [],
        options: { ...prev.options, labels },
        totalBySeries: newTotalBySeries,
      }));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching category sales data:', err);
      setTotalBySeries([]);
      setState((prev) => ({
        ...prev,
        series: [],
        options: { ...prev.options, labels: [] },
        totalBySeries: [],
      }));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchCategorySales();
  }, [fetchCategorySales]);

  const renderLegendItems = () => {
    if (!totalBySeries.length) {
      return <div className="text-sm text-gray-500">No data available</div>;
    }
    return totalBySeries.map((item, index) => (
      <div key={`legend-${index}`} className="flex items-center mb-2">
        <span
          className="inline-block w-3 h-3 mr-2 rounded-full"
          style={{ backgroundColor: state.options.colors?.[index % (state.options.colors?.length || 1)] }}
        ></span>
        <span className="text-sm">{item.name}</span>
        <span className="ml-auto font-medium">{item.total.toLocaleString()}</span>
      </div>
    ));
  };

  const pieChartSeries = totalBySeries.map((item) => item.total);
  // Use type assertion or optional chaining to satisfy TypeScript
  const hasData = pieChartSeries.length > 0 && (state.options.labels?.length || 0) > 0;

  if (loading && !hasData) {
    return (
      <div className="h-64 rounded-sm border border-stroke bg-white p-4 shadow-de dark:border-strokedark dark:bg-chartbody flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Preview Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer h-64 rounded-sm border border-stroke bg-white p-4 shadow-de dark:border-strokedark dark:bg-chartbody"
      >
        <p className="font-semibold text-secondarychart mb-2">Sales by Category</p>
        {hasData ? (
          <div className="flex h-full">
            <div className="w-1/2">
              <ReactApexChart
                options={state.options}
                series={pieChartSeries}
                type="donut"
                height={150}
                width="100%"
              />
            </div>
            <div className="w-1/2 pl-2 overflow-y-auto">{renderLegendItems()}</div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No data available for selected period</p>
          </div>
        )}
      </div>

      {/* Modal for Full Chart */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="mb-4">
          <h4 className="text-xl font-semibold text-black dark:text-white">Sales by Category</h4>
        </div>

        <div className="mb-4 flex gap-4">
          <div className="flex items-center">
            <label className="mr-2 text-sm">Start</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-sm">End</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8"
            />
          </div>
        </div>

        {hasData ? (
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <ReactApexChart
                options={{ ...state.options, legend: { ...state.options.legend, show: false } }}
                series={pieChartSeries}
                type="donut"
                height={350}
                width="100%"
              />
            </div>
            <div className="md:w-1/2 overflow-y-auto px-4 max-h-80">
              <h5 className="text-lg font-medium mb-3">Categories</h5>
              {renderLegendItems()}
              <div className="mt-6">
                <h5 className="text-lg font-medium mb-3">Summary</h5>
                <p className="mb-2">
                  <span className="font-medium">Total Sales: </span>
                  {pieChartSeries.reduce((sum, current) => sum + current, 0).toLocaleString()}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Top Category: </span>
                  {totalBySeries.length > 0 ? totalBySeries[0].name : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">{loading ? 'Loading chart...' : 'No data available for selected period'}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ChartCategory;