// Notification system for rep approvals
const NOTIF_KEY = 'bilquis-notifications';

export interface Notification {
  id: string;
  userId: string; // rep's userId
  message: string;
  formType: string;
  formName: string;
  createdAt: string;
  read: boolean;
}

function getAllNotifications(): Notification[] {
  try {
    const data = localStorage.getItem(NOTIF_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAllNotifications(notifs: Notification[]): void {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function addApprovalNotification(userId: string, formType: string, formName: string): void {
  const notifs = getAllNotifications();
  const typeLabels: Record<string, string> = {
    'doctor-support': 'استمارة دعم طبيب',
    'consignment': 'نموذج تصريف',
    'extra-bonus': 'نموذج بونص إضافي',
  };
  const notif: Notification = {
    id: crypto.randomUUID(),
    userId,
    message: `تم اعتماد ${typeLabels[formType] || formType}${formName ? ` - ${formName}` : ''} من قبل مدير الفرع`,
    formType,
    formName,
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifs.push(notif);
  saveAllNotifications(notifs);
}

export function getNotificationsForUser(userId: string): Notification[] {
  return getAllNotifications()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadCount(userId: string): number {
  return getAllNotifications().filter(n => n.userId === userId && !n.read).length;
}

export function markAllReadForUser(userId: string): void {
  const notifs = getAllNotifications().map(n =>
    n.userId === userId ? { ...n, read: true } : n
  );
  saveAllNotifications(notifs);
}

export function markAsRead(id: string): void {
  const notifs = getAllNotifications().map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  saveAllNotifications(notifs);
}

export function deleteNotification(id: string): void {
  const notifs = getAllNotifications().filter(n => n.id !== id);
  saveAllNotifications(notifs);
}
