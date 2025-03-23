'use client';
import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Modal from '@/components/graphModal/Modal';
import { Input } from '@/components/ui/input';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const initialChartOptions: ApexOptions = {
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  colors: ['#F43F5E'],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4,
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: [],
    labels: {
      style: {
        fontSize: '12px',
      },
    },
  },
  yaxis: {
    title: {
      text: 'Stock Quantity',
    },
    max: 10,
    labels: {
      formatter: (val) => val.toFixed(0),
    },
  },
  tooltip: {
    y: {
      formatter: (val) => `${val} units`,
    },
  },
  responsive: [
    { breakpoint: 2600, options: { chart: { width: 380 } } },
    { breakpoint: 640, options: { chart: { width: 200 } } },
  ],
};

interface ProductStock {
  id: string;
  name: string;
  stock: number;
  Product: { sellprice: number }[];
  category: { name: string }; // Add category relation
}

interface ChartState {
  series: { name: string; data: number[] }[];
  options: ApexOptions;
}

const ChartLowStock: React.FC = () => {
  const [lowStockData, setLowStockData] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [state, setState] = useState<ChartState>({
    series: [{ name: 'Low Stock', data: [] }],
    options: initialChartOptions,
  });

  const fetchLowStock = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<ProductStock[]>('/api/storage');
      const allStocks = response.data;

      const lowStocks = allStocks.filter((stock) => stock.stock <= 10);
      setLowStockData(lowStocks);

      // Include category in the name (e.g., "Product A (Electronics)")
      const categories = lowStocks.map((stock) => `${stock.name} (${stock.category.name})`);
      const quantities = lowStocks.map((stock) => stock.stock);
      const maxQuantity = Math.max(...quantities, 10) + 1;

      setState((prev) => ({
        ...prev,
        series: [{ name: 'Low Stock', data: quantities }],
        options: {
          ...prev.options,
          xaxis: { ...prev.options.xaxis, categories },
          yaxis: { ...prev.options.yaxis, max: maxQuantity },
        },
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch low stock data');
      console.error('Error fetching low stock data:', err);
      setLowStockData([]);
      setState((prev) => ({
        ...prev,
        series: [{ name: 'Low Stock', data: [] }],
        options: { ...prev.options, xaxis: { ...prev.options.xaxis, categories: [] } },
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const hasData = state.series[0].data.length > 0;

  const previewCategories = state.options.xaxis?.categories?.slice(0, 5) || [];
  const previewOptions: ApexOptions = {
    ...state.options,
    xaxis: { ...state.options.xaxis, categories: previewCategories },
  };
  const previewSeries = state.series.map((s) => ({ ...s, data: s.data.slice(0, 5) }));

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
        <p className="font-semibold text-secondarychart mb-2">Low Stock Inventory (Top 5)</p>
        {hasData ? (
          <div className="h-full">
            <ReactApexChart
              options={previewOptions}
              series={previewSeries}
              type="bar"
              height={150}
              width="100%"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No low stock items available</p>
          </div>
        )}
      </div>

      {/* Modal for Full Chart */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="mb-4">
          <h4 className="text-xl font-semibold text-black dark:text-white">Low Stock Inventory</h4>
        </div>

        {hasData ? (
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/3">
              <ReactApexChart
                options={state.options}
                series={state.series}
                type="bar"
                height={350}
                width="100%"
              />
            </div>
            <div className="md:w-1/3 overflow-y-auto px-4 max-h-80">
              <h5 className="text-lg font-medium mb-3">Low Stock Details</h5>
              {lowStockData.map((item, index) => (
                <div key={`low-stock-${index}`} className="flex items-center mb-2">
                  <span className="text-sm">{`${item.name} (${item.category.name})`}</span>
                  <span className="ml-auto font-medium">{item.stock} units</span>
                </div>
              ))}
              <div className="mt-6">
                <h5 className="text-lg font-medium mb-3">Summary</h5>
                <p className="mb-2">
                  <span className="font-medium">Total Low Stock Items: </span>
                  {lowStockData.length}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">{loading ? 'Loading chart...' : 'No low stock items available'}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ChartLowStock;