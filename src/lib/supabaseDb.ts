// Supabase-based database layer — replaces localStorage db.ts
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FormRow = Database["public"]["Tables"]["forms"]["Row"];
type FormInsert = Database["public"]["Tables"]["forms"]["Insert"];
type FormUpdate = Database["public"]["Tables"]["forms"]["Update"];

export type FormType = "doctor-support" | "consignment" | "extra-bonus";
export type FormStatus = "draft" | "pending-approval" | "approved";

export interface FormRecord {
  id: string;
  type: FormType;
  data: Record<string, any>;
  status: FormStatus;
  userId: string;
  approvedBy?: string | null;
  approvedByName?: string | null;
  submittedForApprovalAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: FormRow): FormRecord {
  return {
    id: row.id,
    type: row.type as FormType,
    data: (row.data as Record<string, any>) || {},
    status: row.status as FormStatus,
    userId: row.user_id,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name,
    submittedForApprovalAt: row.submitted_for_approval_at,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAll(): Promise<FormRecord[]> {
  const { data, error } = await supabase.from("forms").select("*").order("created_at", { ascending: false });
  if (error) { console.error("getAll error:", error); return []; }
  return (data || []).map(mapRow);
}

export async function getByType(type: FormType): Promise<FormRecord[]> {
  const { data, error } = await supabase.from("forms").select("*").eq("type", type).order("created_at", { ascending: false });
  if (error) { console.error("getByType error:", error); return []; }
  return (data || []).map(mapRow);
}

export async function getByUser(userId: string): Promise<FormRecord[]> {
  const { data, error } = await supabase.from("forms").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) { console.error("getByUser error:", error); return []; }
  return (data || []).map(mapRow);
}

export async function getByTypeAndUser(type: FormType, userId: string): Promise<FormRecord[]> {
  const { data, error } = await supabase.from("forms").select("*").eq("type", type).eq("user_id", userId).order("created_at", { ascending: false });
  if (error) { console.error("getByTypeAndUser error:", error); return []; }
  return (data || []).map(mapRow);
}

export async function getPendingForManager(): Promise<FormRecord[]> {
  const { data, error } = await supabase.from("forms").select("*").eq("status", "pending-approval").order("submitted_for_approval_at", { ascending: true });
  if (error) { console.error("getPendingForManager error:", error); return []; }
  return (data || []).map(mapRow);
}

export async function getPendingByUser(userId: string): Promise<FormRecord[]> {
  const { data, error } = await supabase.from("forms").select("*").eq("user_id", userId).eq("status", "pending-approval");
  if (error) { console.error("getPendingByUser error:", error); return []; }
  return (data || []).map(mapRow);
}

export async function getById(id: string): Promise<FormRecord | undefined> {
  const { data, error } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  return mapRow(data);
}

export async function save(record: { type: FormType; data: Record<string, any>; userId: string; status?: FormStatus }): Promise<FormRecord | null> {
  const insert: FormInsert = {
    type: record.type,
    data: record.data,
    user_id: record.userId,
    status: record.status || "draft",
  };
  const { data, error } = await supabase.from("forms").insert(insert).select().single();
  if (error) { console.error("save error:", error); return null; }
  return mapRow(data);
}

export async function updateRecord(id: string, data: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("forms").update({ data } as FormUpdate).eq("id", id);
  if (error) console.error("updateRecord error:", error);
}

export async function updateRecordStatus(id: string, status: FormStatus, approvedByName?: string, approvedBy?: string): Promise<void> {
  const update: FormUpdate = { status };
  if (status === "pending-approval") {
    update.submitted_for_approval_at = new Date().toISOString();
  }
  if (status === "approved") {
    update.approved_at = new Date().toISOString();
    if (approvedByName) update.approved_by_name = approvedByName;
    if (approvedBy) update.approved_by = approvedBy;
  }
  const { error } = await supabase.from("forms").update(update).eq("id", id);
  if (error) console.error("updateRecordStatus error:", error);
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from("forms").delete().eq("id", id);
  if (error) console.error("deleteRecord error:", error);
}

export async function deleteAll(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("forms").delete().eq("user_id", user.id);
  if (error) console.error("deleteAll error:", error);
}
