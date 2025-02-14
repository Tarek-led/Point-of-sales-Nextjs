import { db } from '@/lib/db'; // Prisma client
import { supabase } from '@/lib/supabase'; // Supabase client

export async function syncAllDataToSupabase() {
  try {
    // Step 1: Sync transactions table first
    const transactions = await db.transaction.findMany({
      include: {
        products: true, // Include the products sold in each transaction
      },
    });

    const transactionIds = transactions.map((transaction) => transaction.id);

    // Fetch all transactions from Supabase
    const { data: supabaseTransactions, error: supabaseTransactionError } = await supabase
      .from('transactions')
      .select('id');

    if (supabaseTransactionError) {
      console.error('Error fetching transactions from Supabase:', supabaseTransactionError);
    } else {
      // Delete transactions from Supabase that no longer exist locally
      for (const supabaseTransaction of supabaseTransactions) {
        if (!transactionIds.includes(supabaseTransaction.id)) {
          // Delete related sale records if the transaction is deleted locally
          const { error: deleteSaleError } = await supabase
            .from('on_sale_products')
            .delete()
            .eq('transaction_id', supabaseTransaction.id);

          if (deleteSaleError) {
            console.error('Error deleting sale data for transaction:', deleteSaleError);
          } else {
            console.log(`Successfully deleted sale data for transaction: ${supabaseTransaction.id}`);
          }

          // Delete the transaction itself
          const { error: deleteTransactionError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', supabaseTransaction.id);

          if (deleteTransactionError) {
            console.error('Error deleting transaction:', deleteTransactionError);
          } else {
            console.log(`Successfully deleted transaction: ${supabaseTransaction.id}`);
          }
        }
      }
    }

    // Step 2: Now, sync transactions that exist locally but not in Supabase
    for (const transaction of transactions) {
      const { data: existingTransaction, error: transactionError } = await supabase
        .from('transactions')
        .select()
        .eq('id', transaction.id);

      if (transactionError) {
        console.error('Error syncing transaction:', transactionError);
      } else {
        const upsertTransactionData = {
          id: existingTransaction?.[0]?.id || transaction.id,
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
    }

    // Step 3: Now, sync products and product stocks after transactions are synced
    const products = await db.product.findMany({
      include: {
        productstock: true, // Include related product stock
        OnSaleProduct: { include: { transaction: true } }, // Correct relation name: 'OnSaleProduct'
      },
    });

    const productIds = products.map((product) => product.productId);

    // Fetch all products from Supabase
    const { data: supabaseProducts, error: supabaseProductError } = await supabase
      .from('products')
      .select('product_id');

    if (supabaseProductError) {
      console.error('Error fetching products from Supabase:', supabaseProductError);
    } else {
      // Delete products from Supabase that no longer exist locally
      for (const supabaseProduct of supabaseProducts) {
        if (!productIds.includes(supabaseProduct.product_id)) {
          // Delete related product stock from Supabase using the `id` which is the same as `product_id`
          const { error: deleteProductStockError } = await supabase
            .from('product_stocks')
            .delete()
            .eq('id', supabaseProduct.product_id); // Use `id` which is same as `product_id`

          if (deleteProductStockError) {
            console.error('Error deleting product stock from Supabase:', deleteProductStockError);
          } else {
            console.log(`Successfully deleted product stock for product: ${supabaseProduct.product_id}`);
          }

          // Delete the product itself
          const { error: deleteProductError } = await supabase
            .from('products')
            .delete()
            .eq('product_id', supabaseProduct.product_id);

          if (deleteProductError) {
            console.error('Error deleting product from Supabase:', deleteProductError);
          } else {
            console.log(`Successfully deleted product: ${supabaseProduct.product_id}`);
          }

          // Delete corresponding sales (on_sale_products)
          const { error: deleteSalesError } = await supabase
            .from('on_sale_products')
            .delete()
            .eq('product_id', supabaseProduct.product_id);

          if (deleteSalesError) {
            console.error('Error deleting sales data for product:', deleteSalesError);
          } else {
            console.log(`Successfully deleted sales data for product: ${supabaseProduct.product_id}`);
          }
        }
      }
    }

    // Step 4: Sync OnSaleProduct data
    for (const product of products) {
      // Sync OnSaleProduct data for each product
      for (const sale of product.OnSaleProduct) {
        // Ensure the corresponding transaction exists in Supabase
        const { data: existingTransaction, error: transactionError } = await supabase
          .from('transactions')
          .select()
          .eq('id', sale.transaction.id);

        if (transactionError) {
          console.error('Error fetching transaction:', transactionError);
        } else if (!existingTransaction || existingTransaction.length === 0) {
          // Insert missing transaction if it doesn't exist
          const { error: insertTransactionError } = await supabase
            .from('transactions')
            .insert([{ id: sale.transaction.id }]);

          if (insertTransactionError) {
            console.error('Error inserting transaction:', insertTransactionError);
          } else {
            console.log(`Successfully inserted missing transaction: ${sale.transaction.id}`);
          }
        }

        // Sync sale data after ensuring transaction exists
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

    console.log('All data synced successfully!');
  } catch (error) {
    console.error('Error syncing data:', error);
  }
}
