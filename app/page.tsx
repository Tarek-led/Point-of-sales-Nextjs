'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage('Please fill in both fields.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = data.redirectUrl;
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <main>
      <div className="h-screen w-full dark:bg-black bg-gray-400/[0.5] dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
        {/* Disabling the background overlay temporarily */}
        <div className="absolute inset-0 flex items-center justify-center dark:bg-black bg-white/[0.8] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center h-[30rem] bg-white p-10 rounded-lg shadow-md dark:bg-black dark:text-white w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Sign in to Ixuapps</h2>

          {errorMessage && (
            <div className="text-red-600 text-sm mb-4">
              {errorMessage}
            </div>
          )}

          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border rounded p-2 w-full"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border rounded p-2 w-full"
            />
            <Button
              type="submit"
              className="w-full py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
            >
              Login
            </Button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-blue-500 hover:text-blue-700">
                Register here.
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
