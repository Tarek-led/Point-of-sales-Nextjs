'use client';

// components/SyncBackground.tsx
import { useEffect } from 'react';

const SyncBackground = () => {
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        fetch('/api/sync', { method: 'POST' })
          .then((res) => res.json())
          .then((data) => console.log(data.message))
          .catch((err) => console.error('Sync error:', err));
      }
    }, 30* 1000); // Sync every 5 minutes

    // Clean up the interval when the component unmounts
    return () => clearInterval(syncInterval);
  }, []);

  return null;
};

export default SyncBackground;
