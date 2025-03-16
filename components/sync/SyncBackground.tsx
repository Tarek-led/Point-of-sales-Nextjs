'use client';

// components/SyncBackground.tsx
import { useEffect } from 'react';

const SyncBackground = () => {
  // This component will run in the background and sync data with the server
  // useEffect(() => {
  //   const syncInterval = setInterval(() => {
  //     if (navigator.onLine) {
  //       fetch('/api/sync', { method: 'POST' })
  //         .then((res) => res.json())
  //         .then((data) => console.log(data.message))
  //         .catch((err) => console.error('Sync error:', err));
  //     }
  //   }, 300 * 60 * 1000); // Sync every 5 minutes seconds

  //   // Clean up the interval when the component unmounts
  //   return () => clearInterval(syncInterval);
  // }, []);

  return null;
};

export default SyncBackground;
