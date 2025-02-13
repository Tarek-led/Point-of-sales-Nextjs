import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma client
const prisma = new PrismaClient();

// Function to generate a unique ID for a new product
const generateUniqueId = async () => {
  let isUnique = false;
  let customId = '';

  while (!isUnique) {
    customId = `PRD-${uuidv4().slice(0, 8)}`;
    const existingProduct = await prisma.productStock.findUnique({
      where: { id: customId },
    });

    if (!existingProduct) {
      isUnique = true;
    }
  }

  return customId;
};

// Handler function for POST request to create a new product
export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const customId = await generateUniqueId();
    const productId = `PRODUCT-${uuidv4().slice(0, 8)}`;

    const newProduct = await prisma.productStock.create({
      data: {
        id: customId,
        name: body.productName,
        stock: body.stockProduct,
        price: body.buyPrice,
        cat: body.category,
        Product: {
          create: {
            id: productId,
            sellprice: body.sellPrice,
          },
        },
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error during product creation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
