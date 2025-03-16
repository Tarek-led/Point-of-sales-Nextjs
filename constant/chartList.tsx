// constant/chartList.tsx
import { Activity, Crown, HandCoins, FileText } from 'lucide-react';
import { NavItem } from '@/types/Navbar';

export const SCROLLBAR_ITEMS: NavItem[] = [
  {
    title: 'Sales Overtime',
    path: '/analytics/reports/SalesByCategoryOverTime',
    icon: <Activity className="h-4 w-4" />,

  },
  {
    title: 'Daily Reports',
    path: '/analytics/reports',
    icon: <FileText className="h-4 w-4" />,
  },
];
