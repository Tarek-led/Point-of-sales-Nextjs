'use client';
import { Printer } from 'lucide-react';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ReloadIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import eventBus from '@/lib/even';

interface DetailProps {
  data: any[];
  transactionId: string | null;
  setTransactionId: (id: string | null) => void;
  orderType: string;
  paymentMethod: string;
}

const Detail = forwardRef<{ handlePrint: () => void }, DetailProps>(
  ({ data, transactionId, setTransactionId, orderType, paymentMethod }, ref) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [shopName, setShopName] = useState<string>('');

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
          const response = await axios.get('/api/shopdata');
          const shopdata = response.data.data;
          if (response.status === 200) {
            setTaxRate(shopdata.tax || 0);
            setShopName(shopdata.name || 'Unnamed Shop');
          } else {
            toast.error('Failed to fetch data');
          }
        } catch (error: any) {
          toast.error('Failed to fetch data: ' + error.message);
        }
      };
      fetchShopData();
    }, []);

    const handlePrint = useReactToPrint({
      content: () => componentRef.current,
      documentTitle: 'Receipt',
    });

    const handleCheckout = async () => {
      setLoading(true);
      try {
        await axios.patch(`/api/transactions/${transactionId}`, {
          totalAmount: total,
          qTy: data.map((item) => item.quantity),
          productId: data.map((item) => item.productId).join(', '),
        });
        handlePrint();
        localStorage.removeItem('transactionId');
        setTransactionId(null);
        eventBus.emit('clearTransactionData');
      } catch (error: any) {
        toast.error('Checkout error: ' + error.message);
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
              padding: 8mm;
              border: none;
              font-size: 14px;
              font-family: 'Roboto', sans-serif;
              background-color: #f9f9f9;
              border-radius: 6px;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 8mm;
              padding-bottom: 6mm;
              border-bottom: 1px solid #e0e0e0;
            }
            .header-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 2mm;
              color: #333;
            }
            .header-subtitle {
              font-size: 12px;
              color: #888;
            }
            .details {
              margin-bottom: 8mm;
            }
            .totals {
              font-weight: bold;
            }
            .total-row {
              margin-top: 2mm;
              display: flex;
              justify-content: space-between;
              font-size: 14px;
            }
            .separator {
              margin-top: 8mm;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 8mm;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: gray;
              margin-top: 8mm;
            }
          }
        `}</style>
        <Card
          className="print-card overflow-hidden print:w-full print:max-w-[80mm] print:p-4 print:border print:text-[12px] print:font-mono"
          ref={componentRef}
        >
          <CardHeader className="header">
            <div className="header-title">{shopName}</div>
            <CardTitle className="header-subtitle">{transactionId}</CardTitle>
            <CardDescription className="header-subtitle">Date: {currentDate}</CardDescription>
          </CardHeader>

          <CardContent className="details">
            <div className="font-semibold text-lg">Order Details</div>
            <ul>
              {data.map((item, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{item.product.productstock.name} x {item.quantity}</span>
                  <span>${(item.product.sellprice * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <Separator className="separator" />
            <ul className="totals">
              <li className="flex items-center justify-between">
                <span>Order Type</span>
                <span>{orderType}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Payment Method</span>
                <span>{paymentMethod}</span>
              </li>
              <li className="total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </li>
              <li className="total-row">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </li>
              <li className="total-row">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </li>
            </ul>
          </CardContent>

          <CardFooter className="footer">
            Thank you for shopping with us!
          </CardFooter>
        </Card>
      </div>
    );
  }
);

Detail.displayName = 'Detail';
export default Detail;
