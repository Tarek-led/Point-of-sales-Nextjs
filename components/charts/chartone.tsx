'use client';
import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { initialChartoneOptions } from '@/lib/charts';
import Modal from '@/components/graphModal/Modal';

// Dynamically import ReactApexChart for client-side rendering only
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

// Calculate default dates: past one month until today
const today = new Date();
const lastMonth = new Date();
lastMonth.setMonth(today.getMonth() - 1);
const defaultEndDate = today.toISOString().split('T')[0];
const defaultStartDate = lastMonth.toISOString().split('T')[0];

interface ChartOneState {
  series: {
    name: string;
    data: number[];
  }[];
  options: ApexOptions;
}

const ChartOne: React.FC = () => {
  const [dataChart, setDataChart] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [state, setState] = useState<ChartOneState>({
    series: [{ name: 'Products Sales', data: [] }],
    options: initialChartoneOptions,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Use your existing function to generate full date range (full month)
  const generateDateRange = (start: string, end: string) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const dateArray: string[] = [];
    let currentDate = startDateObj;
    while (currentDate <= endDateObj) {
      dateArray.push(
        currentDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
        })
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  // Update full chart options when the date range changes
  useEffect(() => {
    const newCategories = generateDateRange(startDate, endDate);
    setState((prevState) => ({
      ...prevState,
      options: { ...prevState.options, xaxis: { ...prevState.options.xaxis, categories: newCategories } },
    }));
  }, [startDate, endDate]);

  // Fetch data for the full date range
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`/api/productsale?start=${startDate}&end=${endDate}`);
      const { combinedResult } = response.data;
      const chartData = combinedResult.map((item: { totalQuantity: number }) => item.totalQuantity);
      setDataChart(chartData);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update full chart series when data changes
  useEffect(() => {
    if (dataChart.length > 0) {
      const maxChartData = Math.max(...dataChart) + 1;
      setState((prevState) => ({
        ...prevState,
        series: [{ ...prevState.series[0], data: dataChart }],
        options: { ...prevState.options, yaxis: { ...prevState.options.yaxis, max: maxChartData } },
      }));
    }
  }, [dataChart]);

  // Derive preview options & series (only showing last 5 days)
  const previewCategories =
    state.options.xaxis && Array.isArray(state.options.xaxis.categories)
      ? state.options.xaxis.categories.slice(-5)
      : [];
  const previewOptions: ApexOptions = {
    ...state.options,
    xaxis: { ...state.options.xaxis, categories: previewCategories },
  };
  const previewSeries = state.series.map((s) => ({ ...s, data: s.data.slice(-5) }));

  return (
    <>
      {/* Preview Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer h-64 rounded-sm border border-stroke bg-white p-4 shadow-de dark:border-strokedark dark:bg-chartbody"
      >
        <p className="font-semibold text-secondarychart mb-2">Total Products Sales</p>
        <div className="h-full">
          <ReactApexChart options={previewOptions} series={previewSeries} type="area" height={150} width="100%" />
        </div>
      </div>

      {/* Modal for Full Chart */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="mb-4">
          <h4 className="text-xl font-semibold text-black dark:text-white">Total Products Sales</h4>
        </div>
        {/* Full chart view with date inputs */}
        <div className="mb-4 flex gap-4">
          <div className="flex items-center">
            <label className="mr-2 text-sm">Start</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8" />
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-sm">End</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8" />
          </div>
        </div>
        <div>
          <ReactApexChart options={state.options} series={state.series} type="area" height={420} width="100%" />
        </div>
      </Modal>
    </>
  );
};

export default ChartOne;
