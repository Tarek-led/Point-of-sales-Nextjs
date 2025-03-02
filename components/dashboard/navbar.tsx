'use client';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import axios from 'axios';

function Navbar() {
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

  // Filter the navigation items so that settings only shows for admins.
  const filteredItems = NAVBAR_ITEMS.filter(item => {
    if (item.path === '/settings' || item.path === '/home') {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className="flex-1">
      <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
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
    </div>
  );
}

export default Navbar;
