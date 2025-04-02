// app/api/current-user/route.ts
import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    // parse cookies from the request headers
    const cookies = parse(req.headers.get('cookie') || '');
    const userId = cookies['user-id']; // retrieving the user ID from a cookie

    // Check if userId exists
    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'User not authenticated' }),
        { status: 401 }
      );
    }

    // Fetch user data from the database
    const user = await prisma.user.findUnique({
      where: { id: userId }, // Assuming userId is stored in the session or cookie
    });

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Return user details
    return new Response(
      JSON.stringify({ username: user.username, role: user.role }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: 'Error retrieving user data' }),
      { status: 500 }
    );
  }
}
