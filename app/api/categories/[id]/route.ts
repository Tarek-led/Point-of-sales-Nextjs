import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Handler function for DELETE request
export const DELETE = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    console.log('Attempting to delete category with ID:', params.id); // Debugging log

    // Check if the category exists before deleting
    const categoryExists = await prisma.category.findUnique({
      where: { id: String(params.id) },
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Category not found.' },
        { status: 404 }
      );
    }

    // Delete the category with the specified id
    const category = await prisma.category.delete({
      where: {
        id: String(params.id), // Use the `id` from URL params
      },
    });

    // Return the deleted category in the response
    return NextResponse.json(category, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting category:', error); // Error log
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client
  }
};
