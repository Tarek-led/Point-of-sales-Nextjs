'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'; // Use the Card component

const CreateUser: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user'); // Default role set to 'user'
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // To track if the logged-in user is an admin
  const [users, setUsers] = useState<any[]>([]); // For displaying existing users

  useEffect(() => {
    // Fetch current user info to check if the logged-in user is an admin
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/current-user');
        if (response.status === 200) {
          if (response.data.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Fetch existing users for the list
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users');
        if (response.status === 200) {
          setUsers(response.data.users);
        }
      } catch (error) {
        toast.error('Failed to load users.');
      }
    };

    fetchCurrentUser();
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Please fill in both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Send a POST request to your API to create a user
      const response = await axios.post('/api/create-user', {
        username,
        password,
        role, // Include the role in the user creation
      });

      if (response.status === 200) {
        toast.success('User created successfully');
        setUsername('');
        setPassword('');
        // Fetch updated users list
        const updatedResponse = await axios.get('/api/users');
        if (updatedResponse.status === 200) {
          setUsers(updatedResponse.data.users);
        }
      } else {
        toast.error('Error creating user: ' + response.data.message);
      }
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-5">
      {/* Only render the user creation form if the logged-in user is an admin */}
      {isAdmin ? (
        <Card className="my-5">
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Provide the username, password, and role for the new user.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border rounded-md p-3 w-full"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-md p-3 w-full mt-2"
              />
              {/* Role dropdown with matching design */}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                className="border rounded-md p-3 w-full mt-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                type="submit"
                className="w-full py-2 text-white bg-primary hover:bg-primary/80 rounded-md mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            {/* Optionally you could add more actions here */}
          </CardFooter>
        </Card>
      ) : (
        <p>You are not authorized to create users.</p>
      )}
    </div>
  );
};

export default CreateUser;
