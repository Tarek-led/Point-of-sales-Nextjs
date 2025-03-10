// table.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import TableHeadRecords from './components/TableHead';
import TableBodyRecords from './components/TableBody';
import { fetchRecords } from '@/data/records';
import { PageProps } from '@/types/paginations';
import { PaginationDemo } from '@/components/paginations/pagination';
import { SearchInput } from '@/components/search/search';
import { toast } from 'react-toastify';
import RecordsFilter from './components/RecordsFilter'; // Import your new date filter component

interface Product {
  id: string;
  productId: string;
  quantity: number;
}

interface Recordsdata {
  totalQuantity: number;
  id: string;
  totalAmount: string | null;
  createdAt: Date;
  isComplete: boolean;
  products: Product[];
}

export async function Records(props: PageProps) {
  const pageNumber = Number(props?.searchParams?.page || 1);
  const take = 5;
  const skip = (pageNumber - 1) * take;
  const search =
    typeof props?.searchParams?.search === 'string'
      ? props.searchParams.search
      : undefined;
  
  // Extract startDate and endDate from search params if provided
  const startDate =
    typeof props?.searchParams?.startDate === 'string'
      ? props.searchParams.startDate
      : undefined;
  const endDate =
    typeof props?.searchParams?.endDate === 'string'
      ? props.searchParams.endDate
      : undefined;

  const result = await fetchRecords({ take, skip, query: search, startDate, endDate });
  if (!result) {
    toast.error('Failed to fetch product data');
    return;
  }
  const { data, metadata } = result;
  const convertedData: Recordsdata[] = data.map((item) => ({
    totalQuantity: item.totalQuantity,
    id: item.id,
    totalAmount: item.totalAmount ? item.totalAmount.toString() : null,
    createdAt: item.createdAt,
    isComplete: item.isComplete,
    products: item.products,
  }));
  return (
    <Card x-chunk="dashboard-06-chunk-0" className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your products.</CardDescription>
          </CardHeader>
        </div>
        <div className="flex items-center gap-4 ml-auto mr-4 md:grow-0">
          <RecordsFilter />
          <div className='relative md:grow-0'>
            <SearchInput search={search} />
          </div>
        </div>
      </div>
      <CardContent className="flex-grow">
        <Table>
          <TableHeadRecords />
          <TableBodyRecords data={convertedData} />
        </Table>
      </CardContent>
      <CardFooter className="mt-auto">
        <PaginationDemo {...metadata} />
      </CardFooter>
    </Card>
  );
}
