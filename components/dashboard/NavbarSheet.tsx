'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import { SheetContent } from '@/components/ui/sheet';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { usePathname } from 'next/navigation';
import axios from 'axios';

export function NavbarSheet() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    axios.get('/api/current-user')
      .then((res) => {
        if (res.status === 200 && res.data.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch((err) => console.error('Error fetching user role', err));
  }, []);

  // Filter out Home and Settings for non-admin users
  const filteredItems = NAVBAR_ITEMS.filter(item => {
    if (item.path === '/settings' || item.path === '/home') {
      return isAdmin;
    }
    return true;
  });

  return (
    <SheetContent side="left" className="flex flex-col">
      <nav className="grid gap-2 text-lg font-medium">
        <Link
          href="#"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <TriangleAlert className="h-6 w-6" />
        </Link>
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 ${
              pathname === item.path
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            } transition-all hover:text-primary`}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
        <ScrollAreaDemo />
      </nav>
    </SheetContent>
  );
}
