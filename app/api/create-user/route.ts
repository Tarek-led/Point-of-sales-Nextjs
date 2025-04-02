import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';  // Import UUID generator

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Validate input
  if (!username || !password) {
    return new Response(
      JSON.stringify({ message: 'Username and password are required.' }),
      { status: 400 }
    );
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'Username is already taken.' }),
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a UUID for the new user
    const userId = uuidv4();  // Generate a new UUID

    // Create new user with the generated ID
    const user = await prisma.user.create({
      data: {
        id: userId, // Use the generated UUID
        name: username,
        username,
        password: hashedPassword,
        role: 'user', // Default role or set dynamically
      },
    });

    return new Response(
      JSON.stringify({ message: 'User created successfully.' }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: 'An error occurred while creating the user.' }),
      { status: 500 }
    );
  }
}
