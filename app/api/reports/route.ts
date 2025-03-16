// api/reports/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    if (!dateParam) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }
    
    // Parse the given date and set the boundaries for that day
    const day = new Date(dateParam);
    const startOfDay = new Date(day);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    // Fetch OnSaleProduct records for that day with nested relations
    const sales = await prisma.onSaleProduct.findMany({
      where: {
        saledate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        product: {
          include: {
            productstock: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
    
    // Group sales by product category
    type ReportGroup = { totalQuantity: number; totalSales: number };
    const groups: Record<string, ReportGroup> = {};
    
    for (const sale of sales) {
      // Get the category name
      const categoryName = sale.product.productstock.category.name;
      if (!groups[categoryName]) {
        groups[categoryName] = { totalQuantity: 0, totalSales: 0 };
      }
      groups[categoryName].totalQuantity += sale.quantity;
      // Assume total sale for this record = quantity * product.sellprice
      const salePrice = sale.product.sellprice;
      groups[categoryName].totalSales += sale.quantity * salePrice;
    }
    
    // Convert groups into an array of report entries
    const report = Object.keys(groups).map((cat) => ({
      category: cat,
      totalQuantity: groups[cat].totalQuantity,
      totalSales: groups[cat].totalSales,
    }));
    
    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
