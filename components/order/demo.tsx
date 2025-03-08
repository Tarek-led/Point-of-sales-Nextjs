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
import { Button } from '@/components/ui/button';
import { Trash2, Printer } from 'lucide-react'; // Added Printer icon
import axios from 'axios';
import { toast } from 'react-toastify';
import { AlertDialogDeletetransaction } from './components/dialogDelete';
import CategorySidebar, { ProductStockType } from './components/CategorySidebar';
import OrderSummary from './components/OrderSummary';
import Detail from './components/detail';

export function Orders() {
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductStockType[] | undefined>(undefined);
  const [allProducts, setAllProducts] = useState<ProductStockType[]>([]);
  const [lastTransaction, setLastTransaction] = useState<{ id: string | null; items: any[] } | null>(null);
  const [orderType, setOrderType] = useState('Eat In'); // Default value for order type
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Default value for payment method

  const containerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<{ handlePrint: () => void }>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const storedTransactionId = localStorage.getItem('transactionId');
        const [categoriesResponse, storageResponse] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/storage'),
        ]);

        setAllProducts(storageResponse.data);

        if (storedTransactionId) {
          setTransactionId(storedTransactionId);
          await fetchOrderItems(storedTransactionId);
        } else {
          await createTransaction();
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const fetchOrderItems = async (id: string) => {
    const response = await axios.get(`/api/transactions/${id}`);
    if (response.status === 200) {
      const onSaleProducts = response.data;
      const items = onSaleProducts.map((osp: any) => ({
        product: {
          id: osp.productId,
          name: osp.product.productstock.name,
          sellprice: osp.product.sellprice,
          productstock: { name: osp.product.productstock.name },
        },
        quantity: osp.quantity,
        onSaleProductId: osp.id,
      }));
      setOrderItems(items);
      localStorage.setItem(`orderItems_${id}`, JSON.stringify(items));
    }
  };

  useEffect(() => {
    if (transactionId) {
      localStorage.setItem(`orderItems_${transactionId}`, JSON.stringify(orderItems));
    }
  }, [orderItems, transactionId]);

  const createTransaction = async () => {
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
        setSelectedProducts(undefined);
        localStorage.removeItem(`orderItems_${id}`);
      } else {
        toast.error('Failed to create transaction');
      }
    } catch (error) {
      toast.error('An error occurred: ' + error);
    }
  };

  const handleAddToOrder = useCallback(
    async (product: any, quantity: number) => {
      if (!transactionId) return;

      try {
        setActionLoading(true);
        const productStock = allProducts.find((ps: ProductStockType) => ps.id === product.id);
        if (!productStock) {
          throw new Error('Product stock not found');
        }

        const availableStock = productStock.stock;
        const existingItem = orderItems.find((item: any) => item.product.id === product.id);
        let newQuantity = quantity;

        if (existingItem) {
          newQuantity += existingItem.quantity;
        }

        if (newQuantity > availableStock) {
          toast.error(`Cannot add ${newQuantity} of ${product.name}. Only ${availableStock} in stock.`);
          return;
        }

        const response = await axios.post('/api/onsale', {
          productId: product.id,
          qTy: newQuantity,
          transactionId,
        });

        if (response.status === 201) {
          const onSaleProduct = response.data;
          setOrderItems((prev) => {
            const updatedItems = prev.filter((item: any) => item.product.id !== product.id);
            return [
              ...updatedItems,
              {
                product: {
                  id: product.id,
                  name: product.name,
                  sellprice: product.sellprice,
                  productstock: { name: product.name },
                },
                quantity: newQuantity,
                onSaleProductId: onSaleProduct.id,
              },
            ];
          });
        }
      } catch (error: any) {
        toast.error('Error adding to order: ' + error.message);
      } finally {
        setActionLoading(false);
      }
    },
    [transactionId, orderItems, allProducts]
  );

  const handlePlaceOrder = async () => {
    if (!transactionId || orderItems.length === 0) {
      toast.error('No order to place');
      return;
    }
    try {
      setActionLoading(true);
      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.product.sellprice * item.quantity,
        0
      );
      const payload = {
        totalAmount,
        orderItems,
        orderType, // Add orderType to payload
        paymentMethod, // Add paymentMethod to payload
      };
      await axios.patch(`/api/transactions/${transactionId}`, payload);
      toast.success('Order placed successfully!');

      // Store the current transaction before clearing
      setLastTransaction({ id: transactionId, items: [...orderItems] });

      // Print receipt
      if (detailRef.current) {
        detailRef.current.handlePrint();
      }

      // Clear items and start new transaction
      setOrderItems([]);
      localStorage.removeItem(`orderItems_${transactionId}`);
      await createTransaction();
    } catch (error: any) {
      toast.error('Error placing order: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (detailRef.current) {
      detailRef.current.handlePrint();
    }
  };

  const handleReprintLastReceipt = () => {
    if (!lastTransaction) {
      toast.error('No previous transaction to reprint');
      return;
    }
    if (detailRef.current) {
      setTransactionId(lastTransaction.id);
      setOrderItems(lastTransaction.items);
      setTimeout(() => {
        detailRef.current!.handlePrint();
        setOrderItems([]);
        setTransactionId(localStorage.getItem('transactionId'));
      }, 100);
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

  const handleDeleteOrderItem = useCallback(
    async (productId: string) => {
      const item = orderItems.find((i: any) => i.product.id === productId);
      if (!item || !item.onSaleProductId) return;

      try {
        setActionLoading(true);
        await axios.delete(`/api/onsale/${item.onSaleProductId}`);
        setOrderItems((prev) => prev.filter((i: any) => i.product.id !== productId));
      } catch (error: any) {
        toast.error('Error deleting item: ' + error.message);
      } finally {
        setActionLoading(false);
      }
    },
    [orderItems]
  );

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
          <CardDescription>
            {transactionId || (loading && <span className="skeleton w-24 h-4 inline-block"></span>)}
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDialogDeleteOpen}
              disabled={!transactionId}
            >
              <Trash2 />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprintLastReceipt}
              disabled={!lastTransaction || actionLoading}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Reprint Last
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 overflow-hidden">
          <div className="w-2/5 overflow-y-auto p-4 bg-opacity-50 rounded-lg custom-scrollbar">
            <h3 className="text-md font-semibold mb-2">Products</h3>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-lg"></div>
                ))}
              </div>
            ) : selectedProducts && selectedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {selectedProducts.map((product) => {
                  const sellprice =
                    product.Product && product.Product.length > 0 ? product.Product[0].sellprice : 0;
                  return (
                    <div
                      key={product.id}
                      className="flex justify-between items-center border-2 border-gray-400 rounded-lg p-4 font-semibold hover:bg-cardDarker cursor-pointer"
                      onClick={() =>
                        handleAddToOrder({ id: product.id, name: product.name, sellprice }, 1)
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
              loading={loading}
            />
          </div>
          <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
          <div className="w-2/5 p-4 overflow-y-auto bg-secondary rounded-lg">
            <OrderSummary
              orderItems={orderItems}
              onPlaceOrder={handlePlaceOrder}
              onPrintReceipt={handlePrintReceipt}
              loading={actionLoading}
              onDeleteOrderItem={handleDeleteOrderItem}
              isInitialLoading={loading}
              orderType={orderType} // Pass orderType to OrderSummary
              paymentMethod={paymentMethod} // Pass paymentMethod to OrderSummary
              setOrderType={setOrderType} // Function to update orderType
              setPaymentMethod={setPaymentMethod} // Function to update paymentMethod
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

      <div style={{ display: 'none' }}>
        <Detail
          ref={detailRef}
          data={orderItems}
          transactionId={transactionId}
          setTransactionId={setTransactionId}
          orderType={orderType} // Pass orderType to Detail
          paymentMethod={paymentMethod} // Pass paymentMethod to Detail
        />
      </div>
    </div>
  );
}
