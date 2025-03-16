'use client';
import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { initialChartThreeOptions } from '@/lib/charts';

// Dynamically import ReactApexChart for client-side rendering only
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface ChartThreeState {
  series: {
    name: string;
    data: number[];
  }[];
  options: ApexOptions;
}

type Product = {
  name: string;
};

type TopProductResponse = {
  topProducts: {
    id: string;
    productId: string;
    productstock: Product;
    _sum: {
      quantity: number;
    };
  }[];
  totalQuantity: number;
};

const ChartThree: React.FC = () => {
  const [topProducts, setTopProducts] = useState<TopProductResponse['topProducts']>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ChartThreeState>({
    series: [
      {
        name: 'Sales',
        data: [],
      },
    ],
    options: initialChartThreeOptions,
  });

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await axios.get<TopProductResponse>('/api/favorite');
        const { topProducts } = response.data;
        setTopProducts(topProducts);

        const newData = topProducts.map(
          (product) => product._sum.quantity
        );
        const newCategories = topProducts.map(
          (product) => product.productstock.name
        );
        const maxQuantity = Math.max(...newData) + 1;

        setState((prevState) => ({
          ...prevState,
          series: [
            {
              name: 'Total Sales',
              data: newData,
            },
          ],
          options: {
            ...prevState.options,
            xaxis: {
              ...prevState.options.xaxis,
              categories: newCategories,
            },
            yaxis: {
              ...prevState.options.yaxis,
              max: maxQuantity,
            },
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
    <div className="h-full w-full col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-[1.875rem] shadow-de dark:border-strokedark dark:bg-chartbody sm:px-[1.875rem] xl:col-span-8">
      {/* Header with vertical line decoration */}
      <div className="flex items-center mb-4">
        <div className="flex min-w-[11.875rem] items-center">
          <div className="mr-2 mt-1 w-px h-4 bg-secondarychart"></div>
          <div className="w-full">
            <p className="font-semibold text-secondarychart">Top 5 Favorite Products</p>
          </div>
        </div>
      </div>

      <div id="chartThree" className="-ml-5">
        <ReactApexChart
          options={state.options}
          series={state.series}
          type="bar"
          height={450}
          width="100%"
        />
      </div>
    </div>
  );
};

export default ChartThree;
