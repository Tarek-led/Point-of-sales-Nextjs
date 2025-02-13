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

    // Now, sync products and product stocks after transactions and on_sale_products are synced
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
          // Delete related product stock from Supabase
          const { error: deleteProductStockError } = await supabase
            .from('product_stocks')
            .delete()
            .eq('name', supabaseProduct.product_id);

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

    // Now, sync products and product stocks after transactions and on_sale_products
    for (const product of products) {
      // Sync product if not deleted locally
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
