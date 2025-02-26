import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Function to generate a unique ID for a new OnSaleProduct
const generateUniqueOnSaleProductId = async () => {
  let isUnique = false;
  let customId = '';

  while (!isUnique) {
    customId = `ONSALE-${uuidv4().slice(0, 8)}`;
    const existing = await prisma.onSaleProduct.findUnique({
      where: { id: customId },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  return customId;
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { productId, qTy, transactionId } = body;

    // Fetch the product's stock from the productStock table
    const productStock = await prisma.productStock.findUnique({
      where: { id: productId },
    });

    if (!productStock) {
      return NextResponse.json(
        { error: 'Product stock not found.' },
        { status: 404 }
      );
    }

    // Calculate the new quantity after this order
    let newQuantity = qTy;
    const existingOrderProduct = await prisma.onSaleProduct.findFirst({
      where: {
        productId: productId,
        transactionId: transactionId,
      },
    });

    // console.log('Existing order product:', existingOrderProduct?.quantity);
    // console.log('New quantity before add:', newQuantity);

    // Check if the new order quantity exceeds available stock
    // console.log('New quantity:', newQuantity);
    // console.log('Stock:', productStock.stock);
    if (newQuantity > productStock.stock) {
      return NextResponse.json(
        { error: 'Not enough stock available.' },
        { status: 400 }
      );
    }

    let onSaleProduct;
    if (existingOrderProduct) {
      // Update the existing order with the new total quantity
      onSaleProduct = await prisma.onSaleProduct.update({
        where: { id: existingOrderProduct.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Otherwise, create a new onSaleProduct record
      const customId = await generateUniqueOnSaleProductId();
      onSaleProduct = await prisma.onSaleProduct.create({
        data: {
          id: customId,
          product: { connect: { productId: productId } },
          quantity: qTy,
          transaction: { connect: { id: transactionId } },
        },
      });
    }

    return NextResponse.json(onSaleProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error during ordering:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
