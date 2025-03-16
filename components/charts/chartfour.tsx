'use client';
import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { initialChartfourOptions } from '@/lib/charts';
import Modal from '@/components/graphModal/Modal';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartOneState {
  series: { name: string; data: number[] }[];
  options: ApexOptions;
}

// Calculate default dates: past one month until today
const today = new Date();
const lastMonth = new Date();
lastMonth.setMonth(today.getMonth() - 1);
const defaultEndDate = today.toISOString().split('T')[0];
const defaultStartDate = lastMonth.toISOString().split('T')[0];

const ChartFour: React.FC = () => {
  const [dataChart, setDataChart] = useState<{ [date: string]: { netIncome: number; taxIncome: number; grossIncomeWithTax: number; }; }>({});
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [state, setState] = useState<ChartOneState>({
    series: [
      { name: 'Net Income', data: [44, 55, 41, 67, 22] },
      { name: 'Tax', data: [22, 31, 30, 12, 20] },
      { name: 'Gross Income With Tax', data: [50, 70, 60, 80, 40] },
    ],
    options: initialChartfourOptions,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const generateDateRange = (start: string, end: string) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const dateArray: string[] = [];
    let currentDate = startDateObj;
    while (currentDate <= endDateObj) {
      let formattedDate: string;
      formattedDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      if (!dateArray.includes(formattedDate)) {
        dateArray.push(formattedDate);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  useEffect(() => {
    const newCategories = generateDateRange(startDate, endDate);
    setState((prevState) => ({
      ...prevState,
      options: { ...prevState.options, xaxis: { ...prevState.options.xaxis, categories: newCategories } },
    }));
  }, [startDate, endDate]);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`/api/profit?start=${startDate}&end=${endDate}`);
      const formattedData = response.data.groupedData.reduce(
        (acc: { [date: string]: { netIncome: number; taxIncome: number; grossIncomeWithTax: number; }; }, curr: { date: string; netIncome: number; taxIncome: number; grossIncomeWithTax: number; }) => {
          acc[curr.date] = { netIncome: curr.netIncome, taxIncome: curr.taxIncome, grossIncomeWithTax: curr.grossIncomeWithTax };
          return acc;
        },
        {}
      );
      setDataChart(formattedData);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (Object.keys(dataChart).length > 0) {
      const netIncomeData = Object.values(dataChart).map((entry) => Number(entry.netIncome.toFixed(1)));
      const taxIncomeData = Object.values(dataChart).map((entry) => Number(entry.taxIncome.toFixed(1)));
      const grossIncomeWithTaxData = Object.values(dataChart).map((entry) => Number(entry.grossIncomeWithTax.toFixed(1)));
      const maxChartData = Math.max(...grossIncomeWithTaxData) + 1;
      setState((prevState) => ({
        ...prevState,
        series: [
          { ...prevState.series[0], data: netIncomeData },
          { ...prevState.series[1], data: taxIncomeData },
          { ...prevState.series[2], data: grossIncomeWithTaxData },
        ],
        options: { ...prevState.options, yaxis: { ...prevState.options.yaxis, max: maxChartData } },
      }));
    }
  }, [dataChart]);

  // For preview, show only the last 7 days of data.
  const fullCategories =
    state.options.xaxis && Array.isArray(state.options.xaxis.categories)
      ? state.options.xaxis.categories
      : [];
  const previewCategories = fullCategories.slice(-7);
  const previewOptions: ApexOptions = { ...state.options, xaxis: { ...state.options.xaxis, categories: previewCategories } };
  const previewSeries = state.series.map((s) => ({ ...s, data: s.data.slice(-7) }));

  return (
    <>
      {/* Preview Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer h-64 rounded-sm border border-stroke bg-white p-4 shadow-de dark:border-strokedark dark:bg-chartbody"
      >
        <div className="flex items-center mb-2">
          <p className="text-xl font-semibold text-black dark:text-white">Income</p>
        </div>
        <div className="h-full">
          <ReactApexChart options={previewOptions} series={previewSeries} type="line" height={150} width="100%" />
        </div>
      </div>

      {/* Modal for Full Chart */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap mb-4">
          <div className="flex min-w-[11.875rem] items-center">
            <div className="mr-2 mt-1 w-px h-4 bg-secondarychart"></div>
            <div className="w-full">
              <p className="text-xl font-semibold text-black dark:text-white">Income</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-5">
            <div className="flex min-w-[11.875rem] items-center">
              <div className="flex gap-4 items-center">
                <label className="mr-2 text-sm">Start</label>
                <div>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8" />
                </div>
              </div>
              <div className="flex gap-4 items-center ml-4">
                <label className="mr-2">End</label>
                <div>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="chartFour" className="-ml-5">
          <ReactApexChart options={state.options} series={state.series} type="line" height={420} width="100%" />
        </div>
      </Modal>
    </>
  );
};

export default ChartFour;
