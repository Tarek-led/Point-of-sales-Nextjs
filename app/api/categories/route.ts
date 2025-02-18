import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return new Response(JSON.stringify({ categories }), { status: 200 });
  } catch (error) {
    return new Response('Error fetching categories.', { status: 500 });
  }
}

export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name) {
    return new Response('Category name is required.', { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: { name },
    });
    return new Response(JSON.stringify({ message: 'Category added', category }), { status: 200 });
  } catch (error) {
    return new Response('Error adding category.', { status: 500 });
  }
}
