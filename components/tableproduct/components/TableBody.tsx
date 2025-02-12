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
    cat: string; // ✅ SQLite does not support enums, so it's a string
    stock: number;
    price: number;
  };
}

// Define the props for the TableBodyProduct component
interface TableBodyProductProps {
  data: ProductData[] | undefined; // ✅ Ensure `data` can be undefined
}

// TableBodyProduct component to render the table body for products
const TableBodyProduct: React.FC<TableBodyProductProps> = ({ data }) => {
  // State to manage loading state
  const [loading, setLoading] = useState<boolean>(true);
  // State to manage product data
  const [productData, setProductData] = useState<ProductData[]>([]);

  // ✅ Ensure data is properly set when available
  useEffect(() => {
    if (data && Array.isArray(data)) {
      setProductData(data);
    } else {
      setProductData([]); // ✅ Default to an empty array to prevent `.map()` errors
    }
    setLoading(false);
  }, [data]);

  return (
    <TableBody>
      {/* ✅ Render skeleton rows if loading */}
      {loading
        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        : (productData ?? []).map((item) => ( // ✅ Ensures productData is never undefined
            <TableRow key={item.id}>
              {/* Render product name */}
              <TableCell className="font-medium pl-4">
                {item.productstock.name ?? 'No Name'} {/* ✅ Fallback in case of null */}
              </TableCell>
              
              {/* Render product category with fallback */}
              <TableCell className="pl-4">
                <Badge variant="outline">
                  {item.productstock.cat
                    ? item.productstock.cat.charAt(0).toUpperCase() + item.productstock.cat.slice(1).toLowerCase()
                    : 'Unknown'} {/* ✅ Prevents crashing if cat is null/undefined */}
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
