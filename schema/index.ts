import * as z from 'zod';

// Define Category Options Manually
const categoryOptions = ["ELECTRO", "DRINK", "FOOD", "FASHION"] as const;

const categoryValidator = (val: string): val is (typeof categoryOptions)[number] =>
  categoryOptions.includes(val as (typeof categoryOptions)[number]);

export const productSchema = z
  .object({
    productName: z.string().min(2, 'Product name must be at least 2 characters'),
    buyPrice: z.number().positive('Buy price must be a positive number').min(0.05),
    sellPrice: z.number().positive('Sell price must be a positive number').min(0.01),
    stockProduct: z.number().positive('Stock must be a positive number').min(1),
    category: z.string().min(1, 'Category cannot be empty').refine(categoryValidator, {
      message: 'Select a valid category',
      params: { validValues: categoryOptions.join(', ') },
    }),
  })
  .refine((data) => data.sellPrice > data.buyPrice, {
    message: 'Sell price must be greater than buy price',
    path: ['sellPrice'],
  });

// ✅ Define & Export `restockSchema`
export const restockSchema = z.object({
  stock: z.number().positive('Stock must be a positive number').min(1, 'Stock must be at least 1'),
});

// ✅ Export other schemas
export const onsaleSchema = z.object({
  productId: z.string().min(1, 'Select Product'),
  qTy: z.number().positive('Qty must be a positive number').min(1, 'Qty min 1'),
  transactionId: z.string().min(1, 'Transaction Id is Empty'),
});

export const taxSchema = z.object({
  tax: z.number().min(0, 'Tax min 0').max(100, 'Tax max 100'),
});

export const shopnameSchema = z.object({
  storeName: z.string().min(2, 'Store Name must be at least 2 characters'),
});

export const orderSchema = z.object({
  qTy: z.number().min(1, 'Quantity must be at least 1'),
});