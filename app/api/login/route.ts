// app/api/login/route.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie'; // Import cookie library to set cookies

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return new Response(
      JSON.stringify({ message: 'Please fill in both fields.' }),
      { status: 400 }
    );
  }

  try {
    // Check if user exists in the database using username
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user || !user.password) {
      return new Response(
        JSON.stringify({ message: 'User not found or password is missing.' }),
        { status: 404 }
      );
    }

    // Compare the password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // Set the cookie with user-id
      const cookie = serialize('user-id', user.id, {
        path: '/', // Make it available throughout the site
        httpOnly: true, // Ensures the cookie can't be accessed by JavaScript (for security)
        secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
        maxAge: 60 * 60 * 24 * 7, // Cookie expires in 1 week
      });

      return new Response(
        JSON.stringify({ message: 'Login successful', redirectUrl: '/home' }),
        {
          status: 200,
          headers: { 'Set-Cookie': cookie }, // Set the cookie header in the response
        }
      );
    } else {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials, please try again.' }),
        { status: 401 }
      );
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: 'An error occurred. Please try again later.' }),
      { status: 500 }
    );
  }
}
