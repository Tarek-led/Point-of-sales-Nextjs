'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ShopnameCard from './components/shopname';
import TaxrateCard from './components/taxrate';
import CreateUser from './components/createuser'; // Import the CreateUser component
import eventBus from '@/lib/even';
import { Button } from '../ui/button'; // Replace with the actual path to your Button component
import { Input } from '@/components/ui/input'; // Add input for adding categories

export function Setting() {
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false); // Track if the user is admin
  const [users, setUsers] = useState<any[]>([]); // List of users
  const [categories, setCategories] = useState<any[]>([]); // List of categories (updated to hold objects)
  const [newCategory, setNewCategory] = useState(''); // For adding new categories
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

    // Fetch list of categories for the admin
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        if (response.status === 200) {
          setCategories(response.data.categories); // Assume response contains objects with id and name
        }
      } catch (error) {
        toast.error('Failed to load categories.');
      }
    };

    fetchShopData();
    fetchCurrentUser();
    fetchUsers();
    fetchCategories();

    const handleEventBusEvent = () => {
      fetchShopData();
      fetchCategories(); // Refresh categories list
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

  // Handle adding new category
  const handleAddCategory = async () => {
    if (!newCategory) {
      toast.error('Please enter a category name.');
      return;
    }

    try {
      const response = await axios.post('/api/categories', { name: newCategory });
      if (response.status === 200) {
        const addedCategory = response.data.category; // Get the newly added category object
        setCategories((prevCategories) => [...prevCategories, addedCategory]); // Add new category object
        setNewCategory('');
        toast.success('Category added successfully.');
      } else {
        toast.error('Error adding category.');
      }
    } catch (error) {
      toast.error('Failed to add category.');
    }
  };

  // Handle deleting category
  const handleDeleteCategory = async (categoryId: string) => {
    console.log('Deleting category with ID:', categoryId); // Add this line for debugging
    try {
      const response = await axios.delete(`/api/categories/${categoryId}`); // Send category ID in the URL
      if (response.status === 200) {
        setCategories((prevCategories) =>
          prevCategories.filter((cat) => cat.id !== categoryId) // Remove the category by ID
        );
        toast.success('Category deleted successfully.');
      } else {
        toast.error('Error deleting category.');
      }
    } catch (error) {
      console.error('Error deleting category:', error); // Add this line for debugging
      toast.error('Failed to delete category.');
    }
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
                  className="w-full py-2 text-white bg-primary hover:bg-primary/80 rounded-md text-left flex justify-between items-center"
                >
                  {isUsersDropdownOpen ? 'Hide Users' : 'Show Users'}
                  {/* Dropdown Arrow */}
                  <span className={`ml-2 transform ${isUsersDropdownOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </Button>
                {/* Dropdown Content */}
                {isUsersDropdownOpen && (
                  <div className="mt-4 space-y-2 rounded-md shadow-md bg-white dark:bg-card p-4">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <div
                          key={user.id}
                          className="flex justify-between items-center p-4 bg-gray-100 text-gray-800 dark:bg-cardDarker dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
                        >
                          <span>{user.username} ({user.role})</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-300">No users found.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category Management */}
            {isAdmin && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Manage Categories</h3>

                {/* Category input and add button */}
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category"
                    className="flex-grow"
                  />
                  <Button onClick={handleAddCategory} className="bg-green-500 text-white">
                    Add Category
                  </Button>
                </div>

                {/* List of categories */}
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.id} className="flex justify-between items-center p-2 bg-white text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                      <span>{category.name}</span>
                      <Button
                        onClick={() => handleDeleteCategory(category.id)} // Pass category id for deletion
                        className="bg-red-500 text-white text-xs"
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
