'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ShopnameCard from './components/shopname';
import TaxrateCard from './components/taxrate';
import CreateUser from './components/createuser';
import eventBus from '@/lib/even';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-react'; // Added icons for backup/import

export function Setting() {
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);

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

    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/current-user');
        if (response.status === 200 && response.data.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch user data.');
      }
    };

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

    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        if (response.status === 200) {
          setCategories(response.data.categories);
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
      fetchCategories();
    };

    eventBus.on('fetchStoreData', handleEventBusEvent);

    return () => {
      eventBus.removeListener('fetchStoreData', handleEventBusEvent);
    };
  }, []);

  const toggleDropdown = () => {
    setIsUsersDropdownOpen((prev) => !prev);
  };

  const handleAddCategory = async () => {
    if (!newCategory) {
      toast.error('Please enter a category name.');
      return;
    }

    try {
      const response = await axios.post('/api/categories', { name: newCategory });
      if (response.status === 200) {
        const addedCategory = response.data.category;
        setCategories((prevCategories) => [...prevCategories, addedCategory]);
        setNewCategory('');
        toast.success('Category added successfully.');
      } else {
        toast.error('Error adding category.');
      }
    } catch (error) {
      toast.error('Failed to add category.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    console.log('Deleting category with ID:', categoryId);
    try {
      const response = await axios.delete(`/api/categories/${categoryId}`);
      if (response.status === 200) {
        setCategories((prevCategories) =>
          prevCategories.filter((cat) => cat.id !== categoryId)
        );
        toast.success('Category deleted successfully.');
      } else {
        toast.error('Error deleting category.');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await axios.delete(`/api/users/${userId}`);
      if (response.status === 200) {
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        toast.success('User deleted successfully.');
      } else {
        toast.error('Error deleting user.');
      }
    } catch (error) {
      toast.error('Failed to delete user.');
    }
  };

  // Backup function using API route
  const handleBackup = async () => {
    try {
      const response = await axios.get('/api/backup/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Backup created and downloaded successfully.');
    } catch (error) {
      toast.error('Failed to create backup.');
    }
  };

  // Import function
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post('/api/backup/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(response.data.message);

        // Refresh settings data after import
        const [shopDataRes, usersRes, categoriesRes] = await Promise.all([
          axios.get('/api/shopdata'),
          axios.get('/api/users'),
          axios.get('/api/categories'),
        ]);
        setStoreId(shopDataRes.data.data.id);
        setStoreName(shopDataRes.data.data.name);
        setTaxRate(shopDataRes.data.data.tax);
        setUsers(usersRes.data.users);
        setCategories(categoriesRes.data.categories);
      } catch (error) {
        toast.error('Failed to import data.');
      }
    };
    input.click();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
          {/* Top Right Buttons for Admin */}
          {isAdmin && (
            <div className="flex justify-end gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackup}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Backup Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Data
              </Button>
            </div>
          )}
          <div className="grid gap-6">
            <ShopnameCard storeName={storeName} storeId={storeId} />
            <TaxrateCard tax={taxRate} storeId={storeId} />
            {isAdmin && <CreateUser />}
            {isAdmin && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Existing Users</h3>
                <Button
                  onClick={toggleDropdown}
                  className="w-full py-2 text-white bg-primary hover:bg-primary/80 rounded-md text-left flex justify-between items-center"
                >
                  {isUsersDropdownOpen ? 'Hide Users' : 'Show Users'}
                  <span className={`ml-2 transform ${isUsersDropdownOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </Button>
                {isUsersDropdownOpen && (
                  <div className="mt-4 space-y-2 rounded-md shadow-md bg-white dark:bg-card p-4">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <div
                          key={user.id}
                          className="flex justify-between items-center p-4 bg-gray-100 text-gray-800 dark:bg-cardDarker dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
                        >
                          <span>{user.username} ({user.role})</span>
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-500 text-white text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-300">No users found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {isAdmin && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Manage Categories</h3>
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
                <div className="mt-4 space-y-2 rounded-md shadow-md bg-white dark:bg-card p-4">
                  {categories.length > 0 ? (
                    <ul className="space-y-2">
                      {categories.map((category) => (
                        <li
                          key={category.id}
                          className="flex justify-between items-center p-4 bg-gray-100 text-gray-800 dark:bg-cardDarker dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
                        >
                          <span>{category.name}</span>
                          <Button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-500 text-white text-xs"
                          >
                            Delete
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-300">No categories found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}