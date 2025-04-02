import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Prisma client

export async function GET() {
  try {
    // Fetching all data from SQLite using Prisma
    const users = await db.user.findMany();
    const categories = await db.category.findMany();
    const transactions = await db.transaction.findMany({ 
      include: { products: true } // Include related OnSaleProducts
    });
    const productStocks = await db.productStock.findMany();
    const products = await db.product.findMany({ 
      include: { 
        productstock: true, 
        OnSaleProduct: { include: { transaction: true } } 
      } 
    });
    const onSaleProducts = await db.onSaleProduct.findMany();
    const shopData = await db.shopData.findFirst();

    // Combine into a single object matching your schema
    const backupData = {
      users,
      categories,
      transactions,
      productStocks,
      products,
      onSaleProducts,
      shopData,
    };

    // Convert to JSON string
    const jsonData = JSON.stringify(backupData, null, 2);

    // Return as a downloadable file
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${Date.now()}.json"`, // Filename with timestamp
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}