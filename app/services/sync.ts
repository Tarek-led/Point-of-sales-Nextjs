import { db } from '@/lib/db'; // Prisma client
import { supabase } from '@/lib/supabase'; // Supabase client

/**
 * Checks if the local database is empty. If yes, perform an initial pull from Supabase;
 * otherwise, sync local changes to Supabase.
 */
export async function performInitialSync() {
  // Check critical tables – adjust these if needed
  const localTransactionsCount = await db.transaction.count();
  const localProductsCount = await db.product.count();

  const isFirstSync = localTransactionsCount === 0 && localProductsCount === 0;

  if (isFirstSync) {
    console.log('Initial sync detected: pulling data from Supabase...');
    await pullAllDataFromSupabase();
  } else {
    console.log('Existing local data detected: syncing local changes to Supabase...');
    await syncAllDataToSupabase();
  }
}

/**
 * Pulls all data from Supabase and inserts it into the local database.
 * This function is intended for the initial sync when the local DB is empty.
 */
export async function pullAllDataFromSupabase() {
  try {

    // --- Pull Users ---
    const { data: supabaseUsers, error: userError } = await supabase.from('users').select('*');
    if (userError) console.error('Error fetching users:', userError);
    else {
      for (const user of supabaseUsers) {
        await db.user.upsert({
          where: { id: user.id },
          update: { name: user.name, username: user.username, email: user.email, password: user.password, role: user.role, image: user.image },
          create: { id: user.id, name: user.name, username: user.username, email: user.email, password: user.password, role: user.role, image: user.image },
        });
        console.log(`Pulled user: ${user.username}`);
      }
    }

    // --- Pull Categories ---
    const { data: supabaseCategories, error: categoryError } = await supabase.from('categories').select('*');
    if (categoryError) console.error('Error fetching categories:', categoryError);
    else {
      for (const category of supabaseCategories) {
        await db.category.upsert({
          where: { id: category.id },
          update: { name: category.name },
          create: { id: category.id, name: category.name },
        });
        console.log(`Pulled category: ${category.name}`);
      }
    }

    // --- Pull Transactions ---
    const { data: supabaseTransactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*');

    if (transactionError) {
      console.error('Error fetching transactions from Supabase:', transactionError);
    } else if (supabaseTransactions) {
      for (const transaction of supabaseTransactions) {
        await db.transaction.create({
          data: {
            id: transaction.id,
            totalAmount: transaction.total_amount,
            createdAt: new Date(transaction.created_at), // Convert to Date
            isComplete: transaction.is_complete,
          },
        });
        console.log(`Pulled transaction: ${transaction.id}`);
      }
    }

    // --- Pull Product Stocks ---
    // Pulling product stocks first so that products can later connect to them.
    const { data: supabaseStocks, error: stockError } = await supabase
      .from('product_stocks')
      .select('*');

    if (stockError) {
      console.error('Error fetching product stocks from Supabase:', stockError);
    } else if (supabaseStocks) {
      for (const stock of supabaseStocks) {
        await db.productStock.create({
          data: {
            id: stock.id,
            name: stock.name,
            price: stock.price,
            stock: stock.stock,
            cat: stock.cat,
          },
        });
        console.log(`Pulled product stock: ${stock.name}`);
      }
    }

    // --- Pull Products ---
    // Now that product stocks exist, create products and connect them to their stock.
    const { data: supabaseProducts, error: productError } = await supabase
      .from('products')
      .select('*');

    if (productError) {
      console.error('Error fetching products from Supabase:', productError);
    } else if (supabaseProducts) {
      for (const product of supabaseProducts) {
        await db.product.create({
          data: {
            id: product.product_id,
            sellprice: product.sellprice,
            createdAt: new Date(product.created_at), // Convert to Date
            // Connect the product to its product stock using the same id.
            productstock: {
              connect: { id: product.product_id },
            },
          },
        });
        console.log(`Pulled product: ${product.product_id}`);
      }
    }

    // --- Pull On-Sale Products ---
    const { data: supabaseSales, error: saleError } = await supabase
      .from('on_sale_products')
      .select('*');

    if (saleError) {
      console.error('Error fetching on_sale_products from Supabase:', saleError);
    } else if (supabaseSales) {
      for (const sale of supabaseSales) {
        await db.onSaleProduct.create({
          data: {
            id: sale.id,
            productId: sale.product_id,
            quantity: sale.quantity,
            saledate: sale.saledate, // Adjust if necessary (e.g. new Date(sale.saledate))
            transactionId: sale.transaction_id,
          },
        });
        console.log(`Pulled on_sale_product: ${sale.id}`);
      }
    }

    // --- Pull Shop Data ---
    const { data: supabaseShopData, error: shopDataError } = await supabase
      .from('shop_data')
      .select('*')
      .single();

    if (shopDataError) {
      console.error('Error fetching shop data from Supabase:', shopDataError);
    } else if (supabaseShopData) {
      // Use upsert to avoid unique constraint errors if shop data already exists
      await db.shopData.upsert({
        where: { id: supabaseShopData.id },
        update: {
          name: supabaseShopData.name,
          tax: supabaseShopData.tax,
        },
        create: {
          id: supabaseShopData.id,
          name: supabaseShopData.name,
          tax: supabaseShopData.tax,
        },
      });
      console.log(`Pulled shop data: ${supabaseShopData.name}`);
    }

    console.log('Initial data pull complete.');
  } catch (error) {
    console.error('Error pulling data from Supabase:', error);
  }
}

/**
 * Syncs local data to Supabase.
 * This is your existing logic for pushing local changes and handling deletions.
 */
export async function syncAllDataToSupabase() {
  try {
    // --- Delete Users from Supabase ---
    const localUsers = await db.user.findMany();
    const userIds = localUsers.map((user) => user.id);

    // Fetch all users from Supabase
    const { data: supabaseUsers, error: supabaseUserError } = await supabase
      .from('users')
      .select('id');

    if (supabaseUserError) {
      console.error('Error fetching users from Supabase:', supabaseUserError);
    } else {
      // Delete users from Supabase that no longer exist locally
      for (const supabaseUser of supabaseUsers) {
        if (!userIds.includes(supabaseUser.id)) {
          const { error: deleteUserError } = await supabase
            .from('users')
            .delete()
            .eq('id', supabaseUser.id);

          if (deleteUserError) {
            console.error('Error deleting user from Supabase:', deleteUserError);
          } else {
            console.log(`Successfully deleted user: ${supabaseUser.id}`);
          }
        }
      }
    }


    // --- Delete Categories from Supabase ---
    const localCategories = await db.category.findMany();
    const categoryIds = localCategories.map((category) => category.id);

    // Fetch all categories from Supabase
    const { data: supabaseCategories, error: supabaseCategoryError } = await supabase
      .from('categories')
      .select('id');

    if (supabaseCategoryError) {
      console.error('Error fetching categories from Supabase:', supabaseCategoryError);
    } else {
      // Delete categories from Supabase that no longer exist locally
      for (const supabaseCategory of supabaseCategories) {
        if (!categoryIds.includes(supabaseCategory.id)) {
          const { error: deleteCategoryError } = await supabase
            .from('categories')
            .delete()
            .eq('id', supabaseCategory.id);

          if (deleteCategoryError) {
            console.error('Error deleting category from Supabase:', deleteCategoryError);
          } else {
            console.log(`Successfully deleted category: ${supabaseCategory.id}`);
          }
        }
      }
    }


    // Step 1: Sync transactions, etc.
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
            .eq('id', supabaseProduct.product_id);

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

    // --- Upsert local products and product stocks ---
    for (const product of products) {
      // Upsert product record
      const { data: existingProduct, error: productError } = await supabase
        .from('products')
        .select()
        .eq('product_id', product.productId);

      if (productError && productError.code !== '23505') {
        console.error('Error syncing product:', productError);
      } else {
        const upsertProductData = {
          id: existingProduct?.[0]?.id || product.productId,
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

      // Upsert product stock record (if available)
      if (product.productstock) {
        const { data: existingStock, error: stockError } = await supabase
          .from('product_stocks')
          .select()
          .eq('name', product.productstock.name);

        if (stockError && stockError.code !== '23505') {
          console.error('Error syncing product stock:', stockError);
        } else {
          const upsertStockData = {
            id: existingStock?.[0]?.id || product.productstock.id,
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
      }

      // Upsert OnSaleProduct records for this product
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
            id: existingSale?.[0]?.id || `${sale.productId}-${sale.transaction.id}`,
            product_id: sale.productId,
            quantity: sale.quantity,
            saledate: sale.saledate,
            transaction_id: sale.transaction.id,
          };

          const { error: upsertSaleError } = await supabase
            .from('on_sale_products')
            .upsert(upsertSaleData)
            .select();

          if (upsertSaleError) {
            console.error('Error syncing sale data for product:', upsertSaleError);
          } else {
            console.log(`Successfully synced sale data for product: ${product.productId}`);
          }
        }
      }
    }

    // Step 4: Sync OnSaleProduct data
    for (const product of products) {
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
            id: existingSale?.[0]?.id || sale.productId + '-' + sale.transaction.id,
            product_id: sale.productId,
            quantity: sale.quantity,
            saledate: sale.saledate,
            transaction_id: sale.transaction.id,
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

    // Step 5: Sync Shop Data
    const shopData = await db.shopData.findFirst();
    if (shopData) {
      const { data: existingShopData, error: shopDataError } = await supabase
        .from('shop_data')
        .select()
        .eq('name', shopData.name);

      if (shopDataError && shopDataError.code !== '23505') {
        console.error('Error syncing shop data:', shopDataError);
      } else {
        const upsertShopData = {
          id: existingShopData?.[0]?.id || shopData.name,
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
