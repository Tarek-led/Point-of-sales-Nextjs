'use client';
import { ProductType } from './CategorySidebar';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type OrderItemType = {
  product: ProductType;
  quantity: number;
};

type OrderSummaryProps = {
  orderItems: OrderItemType[];
  onPlaceOrder: () => Promise<void>;
  onPrintReceipt: () => void; // Still here but optional now
  loading: boolean;
  onDeleteOrderItem?: (productId: string) => void;
  isInitialLoading?: boolean;
};

export default function OrderSummary({
  orderItems,
  onPlaceOrder,
  onPrintReceipt,
  loading,
  onDeleteOrderItem,
  isInitialLoading,
}: OrderSummaryProps) {
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.product.sellprice * item.quantity,
    0
  );

  const handlePlaceOrderAndPrint = async () => {
    await onPlaceOrder(); // Printing is now handled in handlePlaceOrder
    // onPrintReceipt(); // Optional: Remove this if printing is fully handled in Orders
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      {isInitialLoading ? (
        <div className="overflow-y-auto max-h-[calc(100%-80px)] custom-scrollbar flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Product</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Price</th>
                <th className="p-2">Total</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2"><div className="skeleton h-4 w-24"></div></td>
                  <td className="p-2 text-center"><div className="skeleton h-4 w-8 mx-auto"></div></td>
                  <td className="p-2 text-right"><div className="skeleton h-4 w-12 ml-auto"></div></td>
                  <td className="p-2 text-right"><div className="skeleton h-4 w-12 ml-auto"></div></td>
                  <td className="p-2 text-center"><div className="skeleton h-8 w-8 mx-auto rounded-full"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : orderItems.length === 0 ? (
        <p>No items added.</p>
      ) : (
        <>
          <div className="overflow-y-auto max-h-[calc(100%-80px)] custom-scrollbar flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Total</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => (
                  <tr key={item.product.id} className="border-b">
                    <td className="p-2">{item.product.name}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">${item.product.sellprice.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      ${(item.product.sellprice * item.quantity).toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      {onDeleteOrderItem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteOrderItem(item.product.id)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Button
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={handlePlaceOrderAndPrint}
              disabled={orderItems.length === 0 || loading}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </Button>
            <span className="font-bold text-right">Subtotal: ${subtotal.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}