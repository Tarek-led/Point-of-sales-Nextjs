'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ShopnameCard from './components/shopname';
import TaxrateCard from './components/taxrate';
import CreateUser from './components/createuser'; // Import the CreateUser component
import eventBus from '@/lib/even';
import { Button } from '../ui/button'; // Replace with the actual path to your Button component

export function Setting() {
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false); // Track if the user is admin
  const [users, setUsers] = useState<any[]>([]); // List of users
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false); // For toggling the dropdown

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const isOnline = navigator.onLine;

        if (!isOnline) {
          toast.error('You are offline. Please check your internet connection.');
          return;
        }

        const response = await axios.get('/api/shopdata');
        const shopdata = response.data.data;

        if (response.status === 200) {
          setStoreId(shopdata.id);
          setStoreName(shopdata.name);
          setTaxRate(shopdata.tax);
        } else {
          toast.error('Failed to fetch data: ' + shopdata.error);
        }
      } catch (error: any) {
        toast.error('Failed to fetch data: ' + (error.response?.data.error || error.message));
      }
    };

    // Fetch current user info to check if logged in user is admin
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/current-user');
        if (response.status === 200 && response.data.role === 'admin') {
          setIsAdmin(true); // User is admin
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch user data.');
      }
    };

    // Fetch list of users for the admin
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

    fetchShopData();
    fetchCurrentUser();
    fetchUsers();

    const handleEventBusEvent = () => {
      fetchShopData();
    };

    eventBus.on('fetchStoreData', handleEventBusEvent);

    return () => {
      eventBus.removeListener('fetchStoreData', handleEventBusEvent);
    };
  }, []);

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setIsUsersDropdownOpen((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
          <div className="grid gap-6">
            <ShopnameCard storeName={storeName} storeId={storeId} />
            <TaxrateCard tax={taxRate} storeId={storeId} />
            {/* Only show CreateUser for admin users */}
            {isAdmin && <CreateUser />}
            {/* Show list of users for the admin */}
            {isAdmin && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Existing Users</h3>
                {/* Dropdown Button */}
                <Button
                  onClick={toggleDropdown}
                  className="text-white bg-blue-500 hover:bg-blue-600 rounded-md py-2 px-4"
                >
                  {isUsersDropdownOpen ? 'Hide Users' : 'Show Users'}
                </Button>
                {/* Dropdown Content */}
                {isUsersDropdownOpen && (
                  <div className="mt-4 space-y-2">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <div
                          key={user.id}
                          className="flex justify-between items-center p-4 bg-gray-800 text-white shadow-lg rounded-lg hover:bg-gray-700 transition duration-200"
                        >
                          <span>{user.username} ({user.role})</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">No users found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
