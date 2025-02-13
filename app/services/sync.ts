import { db } from '@/lib/db'; // Prisma client
import { supabase } from '@/lib/supabase'; // Supabase client

export async function syncAllDataToSupabase() {
  try {
    // Sync transactions table first
    const transactions = await db.transaction.findMany({
      include: {
        products: true, // Include the products sold in each transaction
      },
    });

    for (const transaction of transactions) {
      // Check if the transaction already exists in Supabase using transactionId
      const { data: existingTransaction, error: transactionError } = await supabase
        .from('transactions')
        .select()
        .eq('id', transaction.id)
        .single(); // Expect only one row for the given transaction.id

      if (transactionError && transactionError.code === 'PGRST116') {
        // No existing transaction, insert a new one
        const upsertTransactionData = {
          id: transaction.id, // Use transaction.id
          total_amount: transaction.totalAmount,
          created_at: transaction.createdAt,
          is_complete: transaction.isComplete,
        };

        const { error: upsertTransactionError } = await supabase
          .from('transactions')
          .upsert(upsertTransactionData)
          .select();

        if (upsertTransactionError) {
          console.error('Error syncing transaction:', upsertTransactionError);
        } else {
          console.log(`Successfully synced transaction: ${transaction.id}`);
        }
      }

      // Sync OnSaleProduct relationships for the transaction
      if (Array.isArray(transaction.products)) {
        for (const sale of transaction.products) {
          const { data: existingSale, error: saleError } = await supabase
            .from('on_sale_products')
            .select()
            .eq('product_id', sale.productId)
            .eq('transaction_id', transaction.id);

          if (saleError && saleError.code !== '23505') {
            console.error('Error syncing sale data for transaction:', saleError);
          } else {
            const upsertSaleData = {
              id: existingSale?.[0]?.id || `${sale.productId}-${transaction.id}`, // Ensure unique ID
              product_id: sale.productId,
              quantity: sale.quantity,
              saledate: sale.saledate,
              transaction_id: transaction.id, // Use transaction.id directly as string
            };

            const { error: upsertSaleError } = await supabase
              .from('on_sale_products')
              .upsert(upsertSaleData)
              .select();

            if (upsertSaleError) {
              console.error('Error syncing sale data for transaction:', upsertSaleError);
            } else {
              console.log(`Successfully synced sale data for transaction: ${transaction.id}`);
            }
          }
        }
      } else {
        console.log(`No sale data for transaction ${transaction.id}, skipping.`);
      }
    }

    // Now, sync products and product stocks after transactions and on_sale_products are synced
    const products = await db.product.findMany({
      include: {
        productstock: true, // Include related product stock
        OnSaleProduct: { include: { transaction: true } }, // Correct relation name: 'OnSaleProduct'
      },
    });

    for (const product of products) {
      // Sync product
      const { data: existingProduct, error: productError } = await supabase
        .from('products')
        .select()
        .eq('product_id', product.productId);

      if (productError && productError.code !== '23505') {
        console.error('Error syncing product:', productError);
      } else {
        const upsertProductData = {
          id: existingProduct?.[0]?.id || product.productId, // Use existing ID or the productId as the ID
          product_id: product.productId,
          sellprice: product.sellprice,
          created_at: product.createdAt,
        };

        const { error: upsertProductError } = await supabase
          .from('products')
          .upsert(upsertProductData)
          .select();

        if (upsertProductError) {
          console.error('Error syncing product:', upsertProductError);
        } else {
          console.log(`Successfully synced product: ${product.productId}`);
        }
      }

      // Sync ProductStock data with a similar approach
      const { data: existingStock, error: stockError } = await supabase
        .from('product_stocks')
        .select()
        .eq('name', product.productstock.name);

      if (stockError && stockError.code !== '23505') {
        console.error('Error syncing product stock:', stockError);
      } else {
        const upsertStockData = {
          id: existingStock?.[0]?.id || product.productstock.name, // Use existing ID or the name as the ID
          name: product.productstock.name,
          price: product.productstock.price,
          stock: product.productstock.stock,
          cat: product.productstock.cat,
        };

        const { error: upsertStockError } = await supabase
          .from('product_stocks')
          .upsert(upsertStockData)
          .select();

        if (upsertStockError) {
          console.error('Error syncing product stock:', upsertStockError);
        } else {
          console.log(`Successfully synced product stock: ${product.productstock.name}`);
        }
      }

      // Sync OnSaleProduct data similarly...
      for (const sale of product.OnSaleProduct) {
        const { data: existingSale, error: saleError } = await supabase
          .from('on_sale_products')
          .select()
          .eq('product_id', sale.productId)
          .eq('transaction_id', sale.transaction.id);

        if (saleError && saleError.code !== '23505') {
          console.error('Error syncing sale data:', saleError);
        } else {
          const upsertSaleData = {
            id: existingSale?.[0]?.id || sale.productId + '-' + sale.transaction.id, // Create a unique ID based on productId and transaction.id
            product_id: sale.productId,
            quantity: sale.quantity,
            saledate: sale.saledate,
            transaction_id: sale.transaction.id, // Use transaction.id directly as a string
          };

          const { error: upsertSaleError } = await supabase
            .from('on_sale_products')
            .upsert(upsertSaleData)
            .select();

          if (upsertSaleError) {
            console.error('Error syncing sale data for transaction:', upsertSaleError);
          } else {
            console.log(`Successfully synced sale data for product: ${product.productId}`);
          }
        }
      }
    }

    // Sync shop_data table
    const shopData = await db.shopData.findFirst();
    if (shopData) {
      // Check if the shop data already exists in Supabase using the 'name' field
      const { data: existingShopData, error: shopDataError } = await supabase
        .from('shop_data')
        .select()
        .eq('name', shopData.name);

      if (shopDataError && shopDataError.code !== '23505') {
        console.error('Error syncing shop data:', shopDataError);
      } else {
        const upsertShopData = {
          id: existingShopData?.[0]?.id || shopData.name, // Use name or generate custom string ID
          tax: shopData.tax,
          name: shopData.name,
        };

        const { error: upsertShopDataError } = await supabase
          .from('shop_data')
          .upsert(upsertShopData)
          .select();

        if (upsertShopDataError) {
          console.error('Error syncing shop data:', upsertShopDataError);
        } else {
          console.log(`Successfully synced shop data: ${shopData.name}`);
        }
      }
    }

    console.log('All data synced successfully!');
  } catch (error) {
    console.error('Error syncing data:', error);
  }
}
