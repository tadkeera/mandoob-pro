// Local storage database for forms
export interface FormRecord {
  id: string;
  type: 'doctor-support' | 'consignment' | 'extra-bonus';
  data: Record<string, any>;
  createdAt: string;
  userId?: string;
  status?: 'draft' | 'pending-approval' | 'approved';
  repSignature?: string;
  managerSignature?: string;
  submittedForApprovalAt?: string;
  approvedAt?: string;
}

const STORAGE_KEY = 'bilquis-forms-data';

export function getAll(): FormRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getByType(type: FormRecord['type']): FormRecord[] {
  return getAll().filter(r => r.type === type);
}

export function getByTypeAndUser(type: FormRecord['type'], userId: string): FormRecord[] {
  return getAll().filter(r => r.type === type && r.userId === userId);
}

export function getByUser(userId: string): FormRecord[] {
  return getAll().filter(r => r.userId === userId);
}

export function getPendingForManager(): FormRecord[] {
  return getAll().filter(r => r.status === 'pending-approval');
}

export function getPendingByUser(userId: string): FormRecord[] {
  return getAll().filter(r => r.userId === userId && r.status === 'pending-approval');
}

export function getById(id: string): FormRecord | undefined {
  return getAll().find(r => r.id === id);
}

export function save(record: Omit<FormRecord, 'id' | 'createdAt'>): FormRecord {
  const records = getAll();
  const newRecord: FormRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: record.status || 'draft',
  };
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
}

export function updateRecord(id: string, data: Record<string, any>): void {
  const records = getAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx !== -1) {
    records[idx].data = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

export function updateRecordStatus(id: string, status: FormRecord['status']): void {
  const records = getAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx !== -1) {
    records[idx].status = status;
    if (status === 'pending-approval') {
      records[idx].submittedForApprovalAt = new Date().toISOString();
    }
    if (status === 'approved') {
      records[idx].approvedAt = new Date().toISOString();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

export function updateRecordSignature(id: string, field: 'repSignature' | 'managerSignature', signature: string): void {
  const records = getAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx !== -1) {
    records[idx][field] = signature;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

export function deleteRecord(id: string): void {
  const records = getAll().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportData(): string {
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

export function importData(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}
