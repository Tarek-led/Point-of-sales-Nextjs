import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma client
const prisma = new PrismaClient();

// Function to generate a unique ID for a new OnSaleProduct
const generateUniqueOnSaleProductId = async () => {
  let isUnique = false;
  let customId = '';

  while (!isUnique) {
    customId = `ONSALE-${uuidv4().slice(0, 8)}`;
    const existingOnSaleProduct = await prisma.onSaleProduct.findUnique({
      where: { id: customId },
    });

    if (!existingOnSaleProduct) {
      isUnique = true;
    }
  }

  return customId;
};

// Handler function for POST request to create a new OnSaleProduct
export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    // Generate a unique ID for the OnSaleProduct
    const customId = await generateUniqueOnSaleProductId();

    // Check if a product with the same productId and transactionId already exists in the database
    const existingOrderProduct = await prisma.onSaleProduct.findFirst({
      where: {
        productId: body.productId,
        transactionId: body.transactionId,
      },
    });

    let onSaleProduct;

    if (existingOrderProduct) {
      // If it exists, update the quantity by adding the new quantity to the existing quantity
      onSaleProduct = await prisma.onSaleProduct.update({
        where: {
          id: existingOrderProduct.id, // Use the id of the existing product
        },
        data: {
          quantity: existingOrderProduct.quantity + body.qTy,
        },
      });
    } else {
      // If it doesn't exist, create a new OnSaleProduct
      onSaleProduct = await prisma.onSaleProduct.create({
        data: {
          id: customId, // Pass the generated unique id here
          product: {
            connect: { productId: body.productId }, // Connect product using productId (through the relation)
          },
          quantity: body.qTy,
          transaction: {
            connect: { id: body.transactionId },
          },
        },
      });
    }

    return NextResponse.json(onSaleProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error during OnSaleProduct creation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
