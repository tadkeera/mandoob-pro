import { useEffect, useRef } from 'react';
import { createAutoBackup } from '@/lib/forumStorage';
import { pruneBackups } from '@/lib/storage';

const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export function useAutoBackup() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const initialTimeout = setTimeout(async () => {
      try {
        await createAutoBackup();
        await pruneBackups(10);
      } catch (e) {
        console.error('[AutoBackup] Failed:', e);
      }
    }, 5 * 60 * 1000);

    intervalRef.current = setInterval(async () => {
      try {
        await createAutoBackup();
        await pruneBackups(10);
      } catch (e) {
        console.error('[AutoBackup] Failed:', e);
      }
    }, BACKUP_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
