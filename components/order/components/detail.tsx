'use client';
import { Printer } from 'lucide-react';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TransactionData } from '@/types/transaction';
import axios from 'axios';
import { toast } from 'react-toastify';
import eventBus from '@/lib/even';
import { ReloadIcon } from '@radix-ui/react-icons';

interface DetailProps {
  data: TransactionData[];
  transactionId: string | null;
  setTransactionId: (id: string | null) => void;
}

const Detail = forwardRef<{ handlePrint: () => void }, DetailProps>(
  ({ data, transactionId, setTransactionId }, ref) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [shopName, setShopName] = useState<string>('');

    console.log('Detail data:', data);

    let subtotal = 0;
    data.forEach((item) => {
      subtotal += item.product.sellprice * item.quantity;
    });
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const currentDate = format(new Date(), 'MMMM dd, yyyy');

    useEffect(() => {
      const fetchShopData = async () => {
        try {
          const isOnline = navigator.onLine;
          if (!isOnline) {
            toast.error('You are offline. Please check your internet connection.');
            return;
          }
          const response = await axios.get('/api/shopdata');
          const shopdata = response.data.data;
          if (response.status === 200) {
            setTaxRate(shopdata.tax || 0);
            setShopName(shopdata.name || 'Unnamed Shop');
          } else {
            toast.error('Failed to fetch data: ' + shopdata.error);
          }
        } catch (error: any) {
          toast.error('Failed to fetch data: ' + (error.response?.data.error || error.message));
        }
      };
      fetchShopData();
    }, []);

    const handlePrint = useReactToPrint({
      content: () => componentRef.current,
      documentTitle: 'Receipt',
      onBeforeGetContent: () => setPrinting(true),
      onAfterPrint: () => setPrinting(false),
    });

    const handleCheckout = async () => {
      setLoading(true);
      try {
        const response = await axios.patch(`/api/transactions/${transactionId}`, {
          totalAmount: total,
          qTy: data.map((item) => item.quantity),
          productId: data.map((item) => item.productId).join(', '),
        });
        handlePrint();
        localStorage.removeItem('transactionId');
        setTransactionId(null);
        eventBus.emit('clearTransactionData');
      } catch (error: any) {
        toast.error('Checkout error: ' + (error.response?.data.error || error.message));
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handlePrint,
    }));

    return (
      <div>
        <style jsx>{`
          @media print {
            @page {
              size: 80mm 100mm;
            }
            .print-card {
              width: 80mm;
              max-width: 80mm;
              padding: 4mm;
              border: none;
              font-size: 12px;
              font-family: 'Courier New', Courier, monospace;
            }
            .print-card-header {
              background-color: #f0f0f0;
            }
            .print-card-content {
              padding: 0;
            }
          }
        `}</style>
        <Card
          className="print-card overflow-hidden print:w-full print:max-w-[80mm] print:p-4 print:border print:text-[12px] print:font-mono"
          ref={componentRef}
        >
          <CardHeader className="print-card-header flex flex-row items-start bg-muted/50">
            <div className="grid gap-0.5">
              <div className="text-center font-bold text-lg">{shopName}</div>
              <CardTitle className="group flex items-center gap-2 text-sm font-normal">
                {/* Changed text-lg to text-sm and added font-normal */}
                {transactionId}
              </CardTitle>
              <CardDescription>Date: {currentDate}</CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-1 print:hidden">
              <Button
                size="icon"
                variant="outline"
                className="h-8 gap-1"
                onClick={handleCheckout}
                disabled={total === 0 || !transactionId || printing || loading}
              >
                {loading ? <ReloadIcon className="animate-spin" /> : <Printer />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="print-card-content p-6 text-sm">
            <div className="grid gap-3">
              <div className="font-semibold">Order Details</div>
              <ul className="grid gap-3">
                {data.map((item, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {item.product.productstock.name.charAt(0).toUpperCase() +
                        item.product.productstock.name.slice(1).toLowerCase()}{' '}
                      x <span>{item.quantity}</span>
                    </span>
                    <span>${(item.product.sellprice * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-2" />
              <ul className="grid gap-3">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </li>
                <li className="flex items-center justify-between font-semibold">
                  <span className="text-muted-foreground">Total</span>
                  <span>${total.toFixed(2)}</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
      </div>
    );
  }
);

Detail.displayName = 'Detail';
export default Detail;