// Supabase-based notifications
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  userId: string;
  formId?: string | null;
  formType: string;
  formName?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  "doctor-support": "استمارة دعم طبيب",
  "consignment": "نموذج تصريف",
  "extra-bonus": "نموذج بونص إضافي",
};

export async function addApprovalNotification(userId: string, formType: string, formName: string, formId?: string): Promise<void> {
  const label = typeLabels[formType] || formType;
  const message = `تم اعتماد ${label}${formName ? ` للـ ${formName}` : ""}`;
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    form_id: formId || null,
    form_type: formType,
    form_name: formName,
    message,
    is_read: false,
  });
  if (error) console.error("addApprovalNotification error:", error);
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("getNotifications error:", error); return []; }
  return (data || []).map(r => ({
    id: r.id,
    userId: r.user_id,
    formId: r.form_id,
    formType: r.form_type,
    formName: r.form_name,
    message: r.message,
    isRead: r.is_read,
    createdAt: r.created_at,
  }));
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) console.error("markAsRead error:", error);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (error) console.error("markAllAsRead error:", error);
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) console.error("deleteNotification error:", error);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) return 0;
  return count || 0;
}
