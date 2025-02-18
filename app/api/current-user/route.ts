// app/api/current-user/route.ts
import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // parse cookies from the request headers
    const cookies = parse(req.headers.get('cookie') || '');
    // Assuming you're using a cookie or session-based system to get the logged-in user's ID
    // Example with cookies (replace this with your actual session or JWT logic):
    const userId = cookies['user-id']; // Example: retrieving the user ID from a cookie

    // If you are using JWT, you might get the user info from the token, like:
    // const userId = extractUserIdFromJWT(req.headers['Authorization']);

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

    // Return user details (e.g., username and role)
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
