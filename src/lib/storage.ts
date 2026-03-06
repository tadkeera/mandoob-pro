// IndexedDB storage system with folder simulation (Backup & FORUM)
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'bilquis-offline-db';
const DB_VERSION = 1;

interface StoredFile {
  id: string;
  folder: 'backup' | 'forum';
  name: string;
  data: string;
  createdAt: string;
  size: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'id' });
          store.createIndex('folder', 'folder');
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveFile(folder: 'backup' | 'forum', name: string, data: string): Promise<StoredFile> {
  const db = await getDB();
  const file: StoredFile = {
    id: crypto.randomUUID(),
    folder,
    name,
    data,
    createdAt: new Date().toISOString(),
    size: new Blob([data]).size,
  };
  await db.put('files', file);
  return file;
}

export async function getFilesByFolder(folder: 'backup' | 'forum'): Promise<StoredFile[]> {
  const db = await getDB();
  return db.getAllFromIndex('files', 'folder', folder);
}

export async function getFileById(id: string): Promise<StoredFile | undefined> {
  const db = await getDB();
  return db.get('files', id);
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('files', id);
}

export async function getAllFiles(): Promise<StoredFile[]> {
  const db = await getDB();
  return db.getAll('files');
}

export async function clearFolder(folder: 'backup' | 'forum'): Promise<void> {
  const db = await getDB();
  const files = await getFilesByFolder(folder);
  const tx = db.transaction('files', 'readwrite');
  for (const file of files) {
    await tx.store.delete(file.id);
  }
  await tx.done;
}

// Keep only last N backups
export async function pruneBackups(maxCount: number = 10): Promise<void> {
  const backups = await getFilesByFolder('backup');
  backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (backups.length > maxCount) {
    const db = await getDB();
    const tx = db.transaction('files', 'readwrite');
    for (let i = maxCount; i < backups.length; i++) {
      await tx.store.delete(backups[i].id);
    }
    await tx.done;
  }
}
