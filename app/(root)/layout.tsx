'use client';
import React, { useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
import Link from 'next/link';
import { Menu, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/darkmode/darkmode';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/dashboard/navbar';
import { NavbarSheet } from '@/components/dashboard/NavbarSheet';
import Bread from '@/components/dashboard/breadcrumb';
import { toast } from 'react-toastify';
import axios from 'axios';
import eventBus from '@/lib/even';
import { UserProvider } from '@/contexts/UserContext'; // NEW: import your user provider

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await axios.get('/api/shopdata');
        const shopdata = response.data.data;
        if (response.status === 200) {
          setStoreName(shopdata.name);
        } else {
          toast.error('Failed to fetch data: ' + shopdata.error);
        }
      } catch (error: any) {
        toast.error('Failed to fetch data: ' + (error.response?.data.error || error.message));
      }
    };

    fetchShopData();
    const handleEventBusEvent = () => {
      fetchShopData();
    };
    eventBus.on('fetchStoreData', handleEventBusEvent);
    return () => {
      eventBus.removeListener('fetchStoreData', handleEventBusEvent);
    };
  }, []);

  return (
    // Wrapping app with the UserProvider so that all child components can access the user.
    <UserProvider>
      <div className="bg-gray-300 dark:bg-black">
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <TriangleAlert className="h-6 w-6" />
                  <span>{storeName}</span>
                </Link>
              </div>
              <Navbar />
            </div>
          </div>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <NavbarSheet />
              </Sheet>
              <Bread />
              <ModeToggle />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              <div
                className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
                x-chunk="dashboard-02-chunk-1"
              >
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                  <NextTopLoader showSpinner={false} />
                  {children}
                </ThemeProvider>
              </div>
            </main>
          </div>
        </div>
      </div>
    </UserProvider>
  );
};

export default RootLayout;
