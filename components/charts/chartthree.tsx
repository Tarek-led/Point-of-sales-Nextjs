'use client';
import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { initialChartThreeOptions } from '@/lib/charts';
import Modal from '@/components/graphModal/Modal';

// Dynamically import ReactApexChart for client-side rendering only
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartThreeState {
  series: { name: string; data: number[] }[];
  options: ApexOptions;
}

type Product = { name: string };

type TopProductResponse = {
  topProducts: {
    id: string;
    productId: string;
    productstock: Product;
    _sum: { quantity: number };
  }[];
  totalQuantity: number;
};

const ChartThree: React.FC = () => {
  const [topProducts, setTopProducts] = useState<TopProductResponse['topProducts']>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ChartThreeState>({
    series: [{ name: 'Total Sales', data: [] }],
    options: initialChartThreeOptions,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await axios.get<TopProductResponse>('/api/favorite');
        const { topProducts } = response.data;
        setTopProducts(topProducts);

        const newData = topProducts.map((product) => product._sum.quantity);
        const newCategories = topProducts.map((product) => product.productstock.name);
        const maxQuantity = Math.max(...newData) + 1;

        setState((prevState) => ({
          ...prevState,
          series: [{ name: 'Total Sales', data: newData }],
          options: {
            ...prevState.options,
            xaxis: { ...prevState.options.xaxis, categories: newCategories },
            yaxis: { ...prevState.options.yaxis, max: maxQuantity },
          },
        }));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  return (
    <>
      {/* Preview Card (showing full chart) */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer h-64 rounded-sm border border-stroke bg-white p-4 shadow-de dark:border-strokedark dark:bg-chartbody"
      >
        <p className="font-semibold text-secondarychart mb-2">Top 5 Favorite Products</p>
        <div className="h-full">
          <ReactApexChart options={state.options} series={state.series} type="bar" height={150} width="100%" />
        </div>
      </div>

      {/* Modal for Full Chart */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="mb-4">
          <h4 className="text-xl font-semibold text-black dark:text-white">Top 5 Favorite Products</h4>
        </div>
        <div>
          <ReactApexChart options={state.options} series={state.series} type="bar" height={450} width="100%" />
        </div>
      </Modal>
    </>
  );
};

export default ChartThree;
