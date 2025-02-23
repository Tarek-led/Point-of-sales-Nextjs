// components/OrderSummary.tsx
'use client';
import { ProductType } from './CategorySidebar';

type OrderItemType = {
  product: ProductType;
  quantity: number;
};

type OrderSummaryProps = {
  orderItems: OrderItemType[];
  onPlaceOrder: () => void;
  loading: boolean;
};

export default function OrderSummary({
  orderItems,
  onPlaceOrder,
  loading,
}: OrderSummaryProps) {
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.product.sellprice * item.quantity,
    0
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      {orderItems.length === 0 ? (
        <p>No items added.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Product</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">Total</th>
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
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="p-2 text-right font-bold">
                Subtotal:
              </td>
              <td className="p-2 text-right font-bold">${subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      <div className="mt-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={onPlaceOrder}
          disabled={orderItems.length === 0 || loading}
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
