import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const productStocks = await prisma.productStock.findMany({
      include: {
        Product: {
          select: {
            sellprice: true,
          },
        },
        category: { // Add category relation
          select: {
            name: true, // Only need the category name
          },
        },
      },
    });

    return NextResponse.json(productStocks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product stocks' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}