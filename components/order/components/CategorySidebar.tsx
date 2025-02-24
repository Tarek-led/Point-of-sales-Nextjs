'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export type ProductType = {
  id: string;
  name: string;
  sellprice: number;
};

type Category = {
  id: string;
  name: string;
};

export type ProductStockType = {
  id: string;
  name: string;
  price: number;
  stock: number;
  cat: string;
  Product: { sellprice: number }[];
};

type CategorySidebarProps = {
  onAddToOrder: (product: ProductType, quantity: number) => void;
  onCategorySelect: (products: ProductStockType[]) => void;
};

export default function CategorySidebar({ onAddToOrder, onCategorySelect }: CategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productStocks, setProductStocks] = useState<ProductStockType[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(res.data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductStocks = async () => {
      try {
        const res = await axios.get('/api/storage');
        setProductStocks(res.data);
      } catch (error) {
        console.error('Error fetching product stocks:', error);
      }
    };
    fetchProductStocks();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = productStocks.filter(ps => ps.cat === selectedCategory);
      onCategorySelect(filtered);
    } else {
      onCategorySelect([]);
    }
  }, [selectedCategory, productStocks, onCategorySelect]);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 text-center">Categories</h2>
        <div
          className="max-h-90 overflow-y-auto space-y-4 custom-scrollbar"
        >
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`w-full text-center border-2 border-gray-400 rounded-lg p-4 font-semibold hover:bg-cardDarker ${
                selectedCategory === cat.id ? 'bg-cardDarker border-gray-600' : ''
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}