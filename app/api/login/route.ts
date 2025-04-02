// app/api/login/route.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import crypto from 'crypto'; // Import the crypto library for token generation

const prisma = new PrismaClient();
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 1 week (match cookie maxAge)

export async function POST(req: Request) {
    const { username, password } = await req.json();

    // Validate input
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

        // --- Security Fix: Prevent Username Enumeration ---
        // If user not found OR password field is missing in DB, proceed to password check anyway
        // but ensuring it will fail securely if user is null.
        const HASH_TO_COMPARE = user?.password ?? ''; // Use stored hash or empty string if no user/pass
        const IS_PASSWORD_PROVIDED = !!password;

        // Comparing the provided password with the hash
        // Note: bcrypt.compare is designed to be slow to prevent timing attacks.
        // Comparing against an empty string or null hash will safely fail.
        const isPasswordValid = HASH_TO_COMPARE && IS_PASSWORD_PROVIDED
                               ? await bcrypt.compare(password, HASH_TO_COMPARE)
                               : false;


        // --- Security Fix: Generic Error Message ---
        if (!user || !isPasswordValid) {
             // Return generic 401 for both user not found and invalid password
             return new Response(
                JSON.stringify({ message: 'Invalid credentials, please try again.' }),
                { status: 401 }
             );
        }

        // --- If login is successful ---

        // --- Security Fix: Use Opaque Session Token ---
        // 1. Generate a secure random session token
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // 2. Calculate expiry date for the session
        const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

        // 3. Store the session token in the database
        await prisma.session.create({
            data: {
                token: sessionToken, // Store the generated token
                userId: user.id,     // Link it to the logged-in user
                expiresAt: expiresAt,// Set the expiry time
            },
        });

        // 4. Set the secure cookie with the session token (NOT user.id)
        const cookie = serialize('session-token', sessionToken, { // Use the session token
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_DURATION_SECONDS, // Cookie expires in 1 week (same as session)
            sameSite: 'lax', // Recommended default for CSRF protection balance
        });

        // 5. Return success response with the cookie
        return new Response(
            JSON.stringify({ message: 'Login successful', redirectUrl: '/orders' }), // You might not need redirectUrl if handled client-side
            {
                status: 200,
                headers: { 'Set-Cookie': cookie }, // Set the session cookie
            }
        );

    } catch (error) {
        console.error('Login error:', error); // Log the actual error for debugging
        return new Response(
            JSON.stringify({ message: 'An error occurred. Please try again later.' }),
            { status: 500 }
        );
    } finally {
         await prisma.$disconnect();
    }
}