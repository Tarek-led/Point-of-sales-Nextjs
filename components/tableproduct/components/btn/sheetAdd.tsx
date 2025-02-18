/* eslint-disable react/no-unescaped-entities */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cross2Icon, ReloadIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { productSchema } from '@/schema';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export function SheetAdd({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [productName, setProductName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [stockProduct, setStockProduct] = useState('');
  const [categoryProduct, setCategories] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<{ [key: string]: string }>({});
  const buyPriceNumber = parseFloat(buyPrice) || 0;
  const stockProductNumber = parseFloat(stockProduct) || 0;
  const sellPriceNumber = parseFloat(sellPrice) || 0;
  const [categories, setCategoriesList] = useState<{ id: string; name: string }[]>([]); // Categories list
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      // Reset input value when sheet is closed
      setSearchTerm('');
      setProductName('');
      setSellPrice('');
      setStockProduct('');
      setBuyPrice('');
      setCategories('');
    }
  }, [open]);

  // Fetch categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories'); // Fetch categories from your API
        if (response.status === 200) {
          setCategoriesList(response.data.categories); // Assuming the response contains categories
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCancel = () => {
    onClose();
    setError({});
  };

  const handleAdd = async () => {
    setLoading(true);
  
  
    // Fetch categories to validate category input dynamically
    let categories: { id: string; name: string }[] = [];
    try {
      const response = await axios.get('/api/categories'); // Assuming this endpoint returns categories in { id, name } format
      categories = response.data.categories; // Store fetched categories
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error fetching categories.');
      setLoading(false);
      return;
    }
  
    // Ensure the selected category exists in the fetched categories
    const categoryExists = categories.some(
      (category) => category.name === categoryProduct
    );
  
    if (!categoryExists) {
      toast.error('Invalid category selected.');
      setLoading(false);
      return;
    }
  
    // Find the category ID from the selected category name
    const selectedCategory = categories.find(
      (category) => category.name === categoryProduct
    );
  
    // Ensure category exists in the database and get its ID
    if (!selectedCategory) {
      toast.error('Category not found in the database.');
      setLoading(false);
      return;
    }
  
    // Use the categoryId (not name) to create the product
    try {
      const validatedData = productSchema.parse({
        productName: productName,
        buyPrice: buyPriceNumber,
        sellPrice: sellPriceNumber,
        stockProduct: stockProductNumber,
        category: selectedCategory.id, // Use categoryId here
      });
  
      // Send validated data using axios
      const response = await axios.post('/api/product', validatedData);
  
      // If no errors, close the dialog and refresh the page
      onClose();
      router.refresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        setError((prevError) => ({
          ...prevError,
          ...fieldErrors,
        }));
      } else {
        console.error(error);
        toast.error('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Sheet open={open}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add product</SheetTitle>
          <SheetDescription>Add your product here.</SheetDescription>
          <div
            onClick={handleCancel}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          >
            <Cross2Icon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </div>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productName" className="text-right">
              Product Name
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setError((prevError) => ({ ...prevError, productName: '' }));
              }}
              className="col-span-3"
            />
            {error?.productName && (
              <div className="col-start-2 col-span-3 text-red-500">
                {error.productName}
              </div>
            )}
            <Label htmlFor="buyPrice" className="text-right">
              Buy Price
            </Label>
            <Input
              id="buyPrice"
              value={buyPrice}
              onChange={(e) => {
                setBuyPrice(e.target.value);
                setError((prevError) => ({ ...prevError, buyPrice: '' }));
              }}
              className="col-span-3"
              type="number"
            />
            {error?.buyPrice && (
              <div className="col-start-2 col-span-3 text-red-500">
                {error.buyPrice}
              </div>
            )}
            <Label htmlFor="sellPrice" className="text-right">
              Sell Price
            </Label>
            <Input
              id="sellPrice"
              value={sellPrice}
              onChange={(e) => {
                setSellPrice(e.target.value);
                setError((prevError) => ({ ...prevError, sellPrice: '' }));
              }}
              className="col-span-3"
              type="number"
            />
            {error?.sellPrice && (
              <div className="col-start-2 col-span-3 text-red-500">
                {error.sellPrice}
              </div>
            )}
            <Label htmlFor="stockProduct" className="text-right">
              Stock
            </Label>
            <Input
              id="stockProduct"
              value={stockProduct}
              onChange={(e) => {
                setStockProduct(e.target.value);
                setError((prevError) => ({ ...prevError, stockProduct: '' }));
              }}
              className="col-span-3"
              type="number"
            />
            {error?.stockProduct && (
              <div className="col-start-2 col-span-3 text-red-500">
                {error.stockProduct}
              </div>
            )}
            <Label htmlFor="categoryProduct" className="text-right">
              Category
            </Label>
            <Select
              value={categoryProduct}
              onValueChange={(newValue) => {
                setCategories(newValue);
                setError((prevError) => ({
                  ...prevError,
                  category: '',
                }));
              }}
            >
              <SelectTrigger id="categoryProduct" className="min-w-max">
                <SelectValue
                  className="pr-20"
                  placeholder={
                    searchTerm
                      ? searchTerm.charAt(0).toUpperCase() +
                        searchTerm.slice(1).toLowerCase()
                      : 'Select Category'
                  }
                  onClick={() => setSearchTerm('')}
                />
              </SelectTrigger>
              {error?.category && (
                <div className="col-start-2 col-span-3 text-red-500">
                  {error.category}
                </div>
              )}
              <SelectContent position="popper">
                <input
                  type="text"
                  value={searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Category"
                  style={{ padding: '5px', margin: '5px 0', width: '100%' }}
                />
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name.charAt(0).toUpperCase() +
                      category.name.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              onClick={handleAdd}
              type="submit"
              disabled={loading}
              className="text-gray-100"
            >
              {loading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
