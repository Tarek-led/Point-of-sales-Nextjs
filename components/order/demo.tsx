'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import FullscreenButton from '@/components/fullscreen/fullscreen';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AlertDialogDeletetransaction } from './components/dialogDelete';
import CategorySidebar, { ProductStockType } from './components/CategorySidebar';
import OrderSummary from './components/OrderSummary';

export function Orders() {
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductStockType[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTransactionId = localStorage.getItem('transactionId');
    if (storedTransactionId) {
      setTransactionId(storedTransactionId);
      fetchOrderItems(storedTransactionId);
    } else {
      createTransaction();
    }
  }, []);

  const fetchOrderItems = async (id: string) => {
    try {
      const response = await axios.get(`/api/transactions/${id}`);
      if (response.status === 200) {
        const onSaleProducts = response.data;
        const items = onSaleProducts.map((osp: any) => ({
          product: {
            id: osp.productId,
            name: osp.product.productstock.name,
            sellprice: osp.product.sellprice,
          },
          quantity: osp.quantity,
          onSaleProductId: osp.id,
        }));
        setOrderItems(items);
        localStorage.setItem(`orderItems_${id}`, JSON.stringify(items));
      }
    } catch (error: any) {
      console.error('Error fetching order items:', error);
      const storedOrderItems = localStorage.getItem(`orderItems_${id}`);
      if (storedOrderItems) {
        setOrderItems(JSON.parse(storedOrderItems));
      }
    }
  };

  useEffect(() => {
    if (transactionId) {
      localStorage.setItem(`orderItems_${transactionId}`, JSON.stringify(orderItems));
    }
  }, [orderItems, transactionId]);

  const createTransaction = async () => {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        toast.error('You are offline. Please check your internet connection.');
        return;
      }
      const response = await axios.post('/api/transactions');
      if (response.status === 201) {
        const { id } = response.data;
        localStorage.setItem('transactionId', id);
        setTransactionId(id);
        setOrderItems([]);
        localStorage.removeItem(`orderItems_${id}`);
      } else {
        toast.error('Failed to create transaction');
      }
    } catch (error) {
      toast.error('An error occurred: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToOrder = useCallback(async (product: any, quantity: number) => {
    if (!transactionId) return;

    try {
      setLoading(true);

      // Fetch current stock for the product
      const stockResponse = await axios.get(`/api/storage`);
      const productStock = stockResponse.data.find((ps: ProductStockType) => ps.id === product.id);
      if (!productStock) {
        throw new Error('Product stock not found');
      }

      const availableStock = productStock.stock;
      const existingItem = orderItems.find((item: any) => item.product.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentQuantity + quantity;

      // Check if new quantity exceeds available stock
      if (newQuantity > availableStock) {
        toast.error(`Cannot add ${newQuantity} of ${product.name}. Only ${availableStock} in stock.`);
        return;
      }

      // Save to OnSaleProduct table
      const response = await axios.post('/api/onsale', {
        productId: product.id,
        qTy: newQuantity,
        transactionId,
      });

      if (response.status === 201) {
        const onSaleProduct = response.data;
        setOrderItems(prev => {
          const updatedItems = prev.filter((item: any) => item.product.id !== product.id);
          return [
            ...updatedItems,
            {
              product: { id: product.id, name: product.name, sellprice: product.sellprice },
              quantity: newQuantity,
              onSaleProductId: onSaleProduct.id,
            },
          ];
        });
      }
    } catch (error: any) {
      toast.error('Error adding to order: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [transactionId, orderItems]);

  const handlePlaceOrder = async () => {
    if (!transactionId || orderItems.length === 0) {
      toast.error('No order to place');
      return;
    }
    setLoading(true);
    try {
      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.product.sellprice * item.quantity,
        0
      );
      const payload = {
        totalAmount,
        orderItems,
      };
      await axios.patch(`/api/transactions/${transactionId}`, payload);
      toast.success('Order placed successfully!');
      setOrderItems([]);
      localStorage.removeItem(`orderItems_${transactionId}`);
    } catch (error: any) {
      toast.error('Error placing order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogDeleteOpen = () => {
    setDialogDeleteOpen(true);
  };

  const handleDialogDeleteClose = () => {
    setDialogDeleteOpen(false);
  };

  const handleCategorySelect = useCallback((products: ProductStockType[]) => {
    setSelectedProducts(products);
  }, []);

  const handleDeleteOrderItem = useCallback(async (productId: string) => {
    const item = orderItems.find((i: any) => i.product.id === productId);
    if (!item || !item.onSaleProductId) return;

    try {
      setLoading(true);
      await axios.delete(`/api/onsale/${item.onSaleProductId}`);
      setOrderItems(prev => prev.filter((i: any) => i.product.id !== productId));
    } catch (error: any) {
      toast.error('Error deleting item: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [orderItems]);

  const handleTransactionDelete = () => {
    setTransactionId(null);
    localStorage.removeItem('transactionId');
    setOrderItems([]);
    if (transactionId) {
      localStorage.removeItem(`orderItems_${transactionId}`);
    }
    setDialogDeleteOpen(false);
    createTransaction();
  };

  return (
    <div ref={containerRef} className="w-full h-screen">
      <Card className="h-full w-full flex flex-col">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>{transactionId}</CardDescription>
          <FullscreenButton targetRef={containerRef} />
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDialogDeleteOpen}
              disabled={!transactionId || loading}
            >
              <Trash2 />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 overflow-hidden">
          <div className="w-2/5 overflow-y-auto p-4 bg-opacity-50 rounded-lg custom-scrollbar">
            <h3 className="text-md font-semibold mb-2">Products</h3>
            {selectedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {selectedProducts.map(product => {
                  const sellprice =
                    product.Product && product.Product.length > 0
                      ? product.Product[0].sellprice
                      : 0;
                  return (
                    <div
                      key={product.id}
                      className="flex justify-between items-center border-2 border-gray-400 rounded-lg p-4 font-semibold hover:bg-cardDarker cursor-pointer"
                      onClick={() =>
                        handleAddToOrder(
                          { id: product.id, name: product.name, sellprice },
                          1
                        )
                      }
                    >
                      <span>{product.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a category to view products.</p>
            )}
          </div>
          <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
          <div className="w-1/5 overflow-y-auto h-full custom-scrollbar">
            <CategorySidebar
              onAddToOrder={handleAddToOrder}
              onCategorySelect={handleCategorySelect}
            />
          </div>
          <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
          <div className="w-2/5 p-4 overflow-y-auto bg-secondary rounded-lg">
            <OrderSummary
              orderItems={orderItems}
              onPlaceOrder={handlePlaceOrder}
              loading={loading}
              onDeleteOrderItem={handleDeleteOrderItem}
            />
          </div>
        </CardContent>
        <CardFooter>{/* Optional footer content */}</CardFooter>
        <AlertDialogDeletetransaction
          open={dialogDeleteOpen}
          onClose={handleDialogDeleteClose}
          transactionId={transactionId}
          onDelete={handleTransactionDelete}
        />
      </Card>
    </div>
  );
}