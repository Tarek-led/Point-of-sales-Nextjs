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
  onPlaceOrder: () => void;
  loading: boolean;
  onDeleteOrderItem?: (productId: string) => void;
};

export default function OrderSummary({
  orderItems,
  onPlaceOrder,
  loading,
  onDeleteOrderItem,
}: OrderSummaryProps) {
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.product.sellprice * item.quantity,
    0
  );

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      {orderItems.length === 0 ? (
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
            <button
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={onPlaceOrder}
              disabled={orderItems.length === 0 || loading}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
            <span className="font-bold text-right">Subtotal: ${subtotal.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}