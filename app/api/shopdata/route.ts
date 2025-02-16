export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET handler: returns the first shop data record (or a 404 if none found)
export async function GET(req: NextRequest) {
  try {
    const shopData = await prisma.shopData.findMany();
    if (shopData.length === 0) {
      return NextResponse.json({ error: 'No shop data found' }, { status: 404 });
    }
    const data = shopData[0];
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching shop data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop data. Please try again later.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST handler: creates a new shop data record with the provided store name (and optional tax)
// This lets you "set" the shop name if none exists.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Expecting body to have a storeName property (and optionally tax)
    const shopData = await prisma.shopData.create({
      data: {
        // Here we're using the storeName as the ID for simplicity.
        // In production you might generate a UUID instead.
        id: body.storeName,
        name: body.storeName,
        tax: body.tax || 0,
      },
    });
    return NextResponse.json(shopData, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shop data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
