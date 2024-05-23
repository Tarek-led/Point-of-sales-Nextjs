/* eslint-disable react/no-unescaped-entities */
'use client';
import { cn } from '@/lib/utils';
import React from 'react';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import {
  IconBoxAlignRightFilled,
  IconClock,
  IconCloud,
  IconCalendarMonth,
  IconTableColumn,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import DigitalClock from '../clock/clock';
import DateComponent from '../date/date';
import WeatherComponent from '../weather/weather';
import { Boxes, CircleDollarSign, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
export function BentoGridHome() {
  return (
    <BentoGrid className="w-full mx-auto md:auto-rows-[20rem]">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn('[&>p:text-lg]', item.className)}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}
const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl dark:bg-dot-white/[0.2] bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]  border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black"></div>
);

const SkeletonFour = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2"
    >
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-2xl bg-gray-100 p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <Boxes size={40} />
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Total Product
        </p>
        <p className="border border-red-500 bg-red-100 dark:bg-red-900/20 text-red-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Delusional
        </p>
      </motion.div>
      <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-gray-100 p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center">
        <CircleDollarSign size={40} />
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Income
        </p>
        <Badge
          variant="outline"
          className="border border-green-700 px-2 py-0.5 mt-4"
        >
          <p className="text-green-400">$1000</p>
        </Badge>
      </motion.div>
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-2xl bg-gray-100 p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <Handshake size={40} />
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Total Product Sale
        </p>
        <p className="border border-orange-500 bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Helpless
        </p>
      </motion.div>
    </motion.div>
  );
};
const SkeletonFive = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2  items-start space-x-2 bg-white dark:bg-black"
      >
        <Image
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        />
        <p className="text-xs text-neutral-500">
          There are a lot of cool framerworks out there like React, Angular,
          Vue, Svelte that can make your life ....
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center justify-end space-x-2 w-3/4 ml-auto bg-white dark:bg-black"
      >
        <p className="text-xs text-neutral-500">Use PHP.</p>
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex-shrink-0" />
      </motion.div>
    </motion.div>
  );
};
const items = [
  {
    title: "Don't Forget To Rest Your Soul",
    description: <span className="text-sm">Experience the power of time.</span>,
    header: <DigitalClock />,
    className: 'md:col-span-1',
    icon: <IconClock className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Human Can't Predict A Future",
    description: (
      <span className="text-sm">Don't forget bring you'r umberella.</span>
    ),
    header: <WeatherComponent />,
    className: 'md:col-span-1',
    icon: <IconCloud className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Tomorrow is Tomorrow not Today',
    description: (
      <span className="text-sm">Don't forget you'r special schedule.</span>
    ),
    header: <DateComponent />,
    className: 'md:col-span-1',
    icon: <IconCalendarMonth className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Analysis',
    description: <span className="text-sm">Understand the sale analysis.</span>,
    header: <SkeletonFour />,
    className: 'md:col-span-2',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },

  {
    title: 'Text Summarization',
    description: (
      <span className="text-sm">
        Summarize your lengthy documents with AI technology.
      </span>
    ),
    header: <SkeletonFive />,
    className: 'md:col-span-1',
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-neutral-500" />,
  },
];
