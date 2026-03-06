import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotificationsForUser,
  getUnreadCount,
  markAllReadForUser,
  deleteNotification,
  type Notification,
} from "@/lib/notifications";
import { Bell, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = () => {
    if (!user) return;
    const notifs = getNotificationsForUser(user.id);
    setNotifications(notifs);
    setUnread(getUnreadCount(user.id));
  };

  useEffect(() => {
    load();
    // Poll every 10s for new notifications
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleOpen = (val: boolean) => {
    setOpen(val);
    if (val && user) {
      markAllReadForUser(user.id);
      setTimeout(() => {
        setUnread(0);
        setNotifications(getNotificationsForUser(user.id));
      }, 200);
    }
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    load();
  };

  if (!user || user.role !== "representative") return null;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-bold text-sm">الإشعارات</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={() => {
                if (user) {
                  notifications.forEach(n => deleteNotification(n.id));
                  load();
                }
              }}
            >
              <CheckCheck className="h-3 w-3" /> مسح الكل
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              لا توجد إشعارات
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-2 px-4 py-3 border-b last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString("ar-YE")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors mt-0.5 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
