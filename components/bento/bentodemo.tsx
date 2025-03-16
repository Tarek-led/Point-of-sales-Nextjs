/* eslint-disable react/no-unescaped-entities */
'use client';
import { cn } from '@/lib/utils';
import React from 'react';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import { IconTableColumn } from '@tabler/icons-react';
import ChartOne from '../charts/chartone';
import ChartTwo from '../charts/charttwo';
import ChartThree from '../charts/chartthree';
import ChartFour from '../charts/chartfour';

export function BentoGridHome() {
  return (
    <BentoGrid className="w-full mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          header={item.header}
          className={cn(item.className)}
        />
      ))}
    </BentoGrid>
  );
}

const items = [
  {
    header: <ChartOne />,
    className: 'md:col-span-3', // full width
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    header: <ChartThree />,
    className: 'md:col-span-3',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    header: <ChartFour />,
    className: 'md:col-span-3',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
];
