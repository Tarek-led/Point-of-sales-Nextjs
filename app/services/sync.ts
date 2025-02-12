// services/sync.ts
import { db } from '@/lib/db'; // Prisma client
import { supabase } from '@/lib/supabase'; // Supabase client
import { v4 as uuidv4 } from 'uuid'; // To generate valid UUIDs

export async function syncProductsToSupabase() {
  try {
    // Fetch all products from SQLite (using Prisma)
    const products = await db.product.findMany({
      include: {
        productstock: true, // Include related product stock
      },
    });

    // Loop through the products and sync with Supabase
    for (const product of products) {
      // Generate UUIDs if they're not already UUID format
      const productUUID = uuidv4(); // Always generate a new UUID for the product
      const productStockUUID = uuidv4(); // Always generate a new UUID for the product stock

      // Insert or update the product in Supabase
      const { error: productError } = await supabase
        .from('products')
        .upsert({
          id: productUUID, // Use valid UUID for the product ID
          product_id: product.productId,
          sellprice: product.sellprice,
          created_at: product.createdAt, // Only include if the `createdAt` field is in your model
        })
        .select();

      if (productError) {
        console.error('Error syncing product:', productError);
      } else {
        console.log(`Successfully synced product: ${product.productId}`);
      }

      // Sync ProductStock data
      const { error: stockError } = await supabase
        .from('product_stocks')
        .upsert({
          id: productStockUUID, // Use valid UUID for product stock ID
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
    }

    console.log('All products synced successfully!');
  } catch (error) {
    console.error('Error syncing products:', error);
  }
}
