'use client';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import Dropdown from './btn/Dropdown';
import { Badge } from '@/components/ui/badge';
import SkeletonRow from '@/components/skeleton/products';
import { useState, useEffect } from 'react';

// Define the shape of product data
interface ProductData {
  id: string;
  sellprice: number;
  productstock: {
    id: string;
    name: string;
    cat: string; // category ID
    stock: number;
    price: number;
  };
}

// Define the props for the TableBodyProduct component
interface TableBodyProductProps {
  data: ProductData[] | undefined; // Ensure `data` can be undefined
}

const TableBodyProduct: React.FC<TableBodyProductProps> = ({ data }) => {
  // State to manage loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true); // Loading state for categories
  // State to manage product data
  const [productData, setProductData] = useState<ProductData[]>([]);
  // State to store categories fetched from the API
  const [categories, setCategories] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        const categoryMap: Map<string, string> = new Map(data.categories.map((cat: { id: string, name: string }) => [cat.id, cat.name]));
        setCategories(categoryMap);
        setCategoriesLoading(false); // Set categories as loaded
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setProductData(data);
    } else {
      setProductData([]); // Default to an empty array to prevent `.map()` errors
    }
    setLoading(false);
  }, [data]);

  // Only render the table when both products and categories are loaded
  if (loading || categoriesLoading) {
    return (
      <TableBody>
        {/* Show skeleton rows while loading */}
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </TableBody>
    );
  }

  return (
    <TableBody>
      {/* Render actual table rows once data and categories are fully loaded */}
      {productData.map((item) => (
        <TableRow key={item.id}>
          {/* Render product name */}
          <TableCell className="font-medium pl-4">
            {item.productstock.name ?? 'No Name'}
          </TableCell>

          {/* Render product category with category name */}
          <TableCell className="pl-4">
            <Badge variant="outline">
              {
                categories.get(item.productstock.cat) 
                ? (categories.get(item.productstock.cat) ?? 'Unknown').charAt(0).toUpperCase() + (categories.get(item.productstock.cat) ?? 'Unknown').slice(1).toLowerCase()
                : 'Unknown' 
              }
            </Badge>
          </TableCell>

          {/* Render product sell price */}
          <TableCell className="pl-5">$ {item.sellprice ?? 0}</TableCell>

          {/* Render product stock */}
          <TableCell className="hidden md:table-cell pl-6">
            {item.productstock.stock ?? 0}
          </TableCell>

          {/* Render product price */}
          <TableCell className="hidden md:table-cell pl-4">
            $ {item.productstock.price ?? 0}
          </TableCell>

          {/* Render dropdown for product actions */}
          <TableCell>
            <Dropdown product={item} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};

export default TableBodyProduct;
