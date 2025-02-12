// services/sync.ts
import { db } from '@/lib/db'; // Prisma client
import { supabase } from '@/lib/supabase'; // Supabase client
import { v4 as uuidv4 } from 'uuid'; // To generate valid UUIDs

export async function syncAllDataToSupabase() {
  try {
    // Fetch all products from SQLite (using Prisma)
    const products = await db.product.findMany({
      include: {
        productstock: true, // Include related product stock
        OnSaleProduct: { include: { transaction: true } }, // Correct relation name: 'OnSaleProduct'
      },
    });

    // Sync products and product stock to Supabase
    for (const product of products) {
      const productUUID = uuidv4(); // Always generate a new UUID for the product
      const productStockUUID = uuidv4(); // Always generate a new UUID for the product stock

      // Insert or update the product in Supabase
      const { error: productError, data: existingProduct } = await supabase
        .from('products')
        .upsert({
          id: productUUID,
          product_id: product.productId,
          sellprice: product.sellprice,
          created_at: product.createdAt,
        })
        .select();

      if (productError && productError.code !== '23505') {  // Handle specific duplicate key error
        console.error('Error syncing product:', productError);
      } else {
        if (productError && productError.code === '23505') {
          console.log(`Product with product_id ${product.productId} already exists, skipping insertion.`);
        } else {
          console.log(`Successfully synced product: ${product.productId}`);
        }
      }

      // Sync ProductStock data
      const { error: stockError } = await supabase
        .from('product_stocks')
        .upsert({
          id: productStockUUID,
          name: product.productstock.name,
          price: product.productstock.price,
          stock: product.productstock.stock,
          cat: product.productstock.cat,
        })
        .select();

      if (stockError) {
        console.error('Error syncing product stock:', stockError);
      } else {
        console.log(`Successfully synced product stock: ${product.productstock.name}`);
      }

      // Sync OnSaleProduct (product sales)
      for (const sale of product.OnSaleProduct) {  // Corrected relation name 'OnSaleProduct'
        const saleUUID = uuidv4();
        const { error: saleError } = await supabase
          .from('on_sale_products')
          .upsert({
            id: saleUUID,
            product_id: product.productId,
            quantity: sale.quantity,
            saledate: sale.saledate,
            transaction_id: sale.transaction.id, // Reference to transaction
          })
          .select();

        if (saleError) {
          console.error('Error syncing sale data:', saleError);
        } else {
          console.log(`Successfully synced sale data for product: ${product.productId}`);
        }
      }
    }

    // Sync transactions table
    const transactions = await db.transaction.findMany({
      include: {
        products: true, // Include the products sold in each transaction
      },
    });

    for (const transaction of transactions) {
      const transactionUUID = uuidv4(); // Generate a new UUID for the transaction

      const { error: transactionError } = await supabase
        .from('transactions')
        .upsert({
          id: transactionUUID,
          total_amount: transaction.totalAmount,
          created_at: transaction.createdAt,
          is_complete: transaction.isComplete,
        })
        .select();

      if (transactionError) {
        console.error('Error syncing transaction:', transactionError);
      } else {
        console.log(`Successfully synced transaction: ${transaction.id}`);
      }

      // Sync OnSaleProduct relationships for the transaction
      if (Array.isArray(transaction.products)) {  // Check if 'products' is an array
        for (const sale of transaction.products) {  // Corrected relation name
          const { error: saleError } = await supabase
            .from('on_sale_products')
            .upsert({
              product_id: sale.productId,
              quantity: sale.quantity,
              transaction_id: transactionUUID,
            })
            .select();

          if (saleError) {
            console.error('Error syncing sale data for transaction:', saleError);
          }
        }
      } else {
        console.log(`No sale data for transaction ${transaction.id}, skipping.`);
      }
    }

    // Sync shop_data table (assuming you need to sync this too)
    const shopData = await db.shopData.findFirst();
    if (shopData) {
      const { error: shopDataError } = await supabase
        .from('shop_data')
        .upsert({
          id: uuidv4(),
          tax: shopData.tax,
          name: shopData.name,
        })
        .select();

      if (shopDataError) {
        console.error('Error syncing shop data:', shopDataError);
      } else {
        console.log(`Successfully synced shop data: ${shopData.name}`);
      }
    }

    console.log('All data synced successfully!');
  } catch (error) {
    console.error('Error syncing data:', error);
  }
}
