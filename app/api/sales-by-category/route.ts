// api/sales-by-category/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    // Set the end date to the end of that day:
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch sales from OnSaleProduct within the date range (with nested relations)
    const sales = await prisma.onSaleProduct.findMany({
      where: {
        saledate: { gte: startDate, lte: endDate },
      },
      include: {
        product: {
          include: {
            productstock: {
              include: { category: true },
            },
          },
        },
      },
    });

    // Group sales by day (YYYY-MM-DD) and category
    type GroupData = { day: string; category: string; totalQuantity: number };
    const groups: Record<string, GroupData> = {};

    for (const sale of sales) {
      const day = sale.saledate.toISOString().split('T')[0];
      const category = sale.product.productstock.category.name;
      const key = `${day}_${category}`;
      if (!groups[key]) {
        groups[key] = { day, category, totalQuantity: 0 };
      }
      groups[key].totalQuantity += sale.quantity;
    }

    // Generate an array of all days in the range
    const daysArray: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      daysArray.push(d.toISOString().split('T')[0]);
    }

    // Determine distinct categories
    const categoriesSet = new Set<string>();
    for (const group of Object.values(groups)) {
      categoriesSet.add(group.category);
    }
    const categories = Array.from(categoriesSet);

    // Initialize a series map for each category with zeros for each day
    const seriesMap: Record<string, number[]> = {};
    for (const cat of categories) {
      seriesMap[cat] = daysArray.map(() => 0);
    }

    // Fill the series map using the grouped data
    for (const group of Object.values(groups)) {
      const dayIndex = daysArray.indexOf(group.day);
      seriesMap[group.category][dayIndex] = group.totalQuantity;
    }

    // Build the series array for the chart
    const series = categories.map((cat) => ({
      name: cat,
      data: seriesMap[cat],
    }));

    return NextResponse.json({ series, days: daysArray }, { status: 200 });
  } catch (error) {
    console.error('Error in sales-by-category API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
