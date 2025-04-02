import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();
    const backupData = JSON.parse(fileContent);

    // Upserting all data into SQLite in dependency order

    // Users
    for (const user of backupData.users || []) {
      await db.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          password: user.password,
          role: user.role,
        },
        create: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          password: user.password,
          role: user.role,
        },
      });
    }

    // Categories
    for (const category of backupData.categories || []) {
      await db.category.upsert({
        where: { id: category.id },
        update: { name: category.name },
        create: { id: category.id, name: category.name },
      });
    }

    // Product Stocks
    for (const stock of backupData.productStocks || []) {
      await db.productStock.upsert({
        where: { id: stock.id },
        update: {
          name: stock.name,
          imageProduct: stock.imageProduct,
          price: stock.price,
          stock: stock.stock,
          cat: stock.cat,
        },
        create: {
          id: stock.id,
          name: stock.name,
          imageProduct: stock.imageProduct,
          price: stock.price,
          stock: stock.stock,
          cat: stock.cat,
        },
      });
    }

    // Transactions (before upserting OnSaleProduct due to foreign key dependency)
    for (const transaction of backupData.transactions || []) {
      await db.transaction.upsert({
        where: { id: transaction.id },
        update: {
          totalAmount: transaction.totalAmount ? parseFloat(transaction.totalAmount) : null,
          createdAt: new Date(transaction.createdAt),
          isComplete: transaction.isComplete,
          orderType: transaction.orderType,
          paymentMethod: transaction.paymentMethod,
        },
        create: {
          id: transaction.id,
          totalAmount: transaction.totalAmount ? parseFloat(transaction.totalAmount) : null,
          createdAt: new Date(transaction.createdAt),
          isComplete: transaction.isComplete,
          orderType: transaction.orderType,
          paymentMethod: transaction.paymentMethod,
        },
      });
    }

    // Products (after ProductStock due to foreign key dependency)
    for (const product of backupData.products || []) {
      await db.product.upsert({
        where: { id: product.id },
        update: {
          sellprice: product.sellprice,
          createdAt: new Date(product.createdAt),
          productstock: { connect: { id: product.productId } },
        },
        create: {
          id: product.id,
          sellprice: product.sellprice,
          createdAt: new Date(product.createdAt),
          productstock: { connect: { id: product.productId } },
        },
      });
    }

    // OnSaleProducts (after Products and Transactions due to foreign key dependencies)
    for (const sale of backupData.onSaleProducts || []) {
      await db.onSaleProduct.upsert({
        where: { id: sale.id },
        update: {
          productId: sale.productId,
          quantity: sale.quantity,
          saledate: new Date(sale.saledate),
          transactionId: sale.transactionId,
        },
        create: {
          id: sale.id,
          productId: sale.productId,
          quantity: sale.quantity,
          saledate: new Date(sale.saledate),
          transactionId: sale.transactionId,
        },
      });
    }

    // Shop Data
    if (backupData.shopData) {
      await db.shopData.upsert({
        where: { id: backupData.shopData.id },
        update: {
          tax: backupData.shopData.tax,
          name: backupData.shopData.name,
        },
        create: {
          id: backupData.shopData.id,
          tax: backupData.shopData.tax,
          name: backupData.shopData.name,
        },
      });
    }

    return NextResponse.json({ message: 'Data imported successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}