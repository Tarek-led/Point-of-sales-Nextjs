// app/api/users/[id].ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle DELETE request to delete a user by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({ message: 'User ID is required' }), { status: 400 });
    }

    // Delete user from the database
    const deletedUser = await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return new Response(JSON.stringify({ message: 'User deleted successfully', deletedUser }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error deleting user' }), { status: 500 });
  }
}
