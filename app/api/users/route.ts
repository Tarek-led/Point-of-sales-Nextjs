// app/api/users/route.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return new Response(JSON.stringify({ users }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error fetching users' }), { status: 500 });
  }
}
