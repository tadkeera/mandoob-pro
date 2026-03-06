// Forum storage - manages saved form templates in IndexedDB
import { saveFile, getFilesByFolder, deleteFile } from './storage';
import { exportData } from './db';

export interface SavedForm {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  savedAt: string;
}

export async function saveFormToForum(name: string, type: string, data: Record<string, any>): Promise<void> {
  const form: SavedForm = {
    id: crypto.randomUUID(),
    name,
    type,
    data,
    savedAt: new Date().toISOString(),
  };
  await saveFile('forum', name, JSON.stringify(form));
}

export async function getForumForms(): Promise<SavedForm[]> {
  const files = await getFilesByFolder('forum');
  return files.map(f => {
    try {
      return JSON.parse(f.data) as SavedForm;
    } catch {
      return null;
    }
  }).filter(Boolean) as SavedForm[];
}

export async function deleteForumForm(id: string): Promise<void> {
  const files = await getFilesByFolder('forum');
  const file = files.find(f => {
    try {
      const parsed = JSON.parse(f.data);
      return parsed.id === id;
    } catch {
      return false;
    }
  });
  if (file) await deleteFile(file.id);
}

export async function exportForumData(): Promise<string> {
  const forms = await getForumForms();
  return JSON.stringify(forms, null, 2);
}

export async function createAutoBackup(): Promise<void> {
  const data = exportData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await saveFile('backup', `auto-backup-${timestamp}`, data);
}
