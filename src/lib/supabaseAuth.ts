// Supabase-based auth layer — replaces localStorage auth.ts
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type UserRole = "admin" | "branch-manager" | "representative";

export interface User {
  id: string;
  username: string;
  password?: string; // kept for compat, not used with Supabase
  role: UserRole;
  displayName: string;
  branchId?: string;
  managerName?: string;
}

function mapProfile(p: ProfileRow): User {
  return {
    id: p.id,
    username: p.username,
    role: p.role as UserRole,
    displayName: p.display_name,
    branchId: p.branch_id || undefined,
    managerName: p.manager_name || undefined,
  };
}

export async function signUp(username: string, password: string, displayName: string, role: UserRole = "representative", branchId?: string): Promise<{ user: User | null; error: string | null }> {
  // Use edge function to create user (admin-only, doesn't change current session)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ username, password, displayName, role, branchId }),
  });

  const result = await response.json();
  if (!response.ok || result.error) return { user: null, error: result.error || "فشل إنشاء الحساب" };

  return { user: result.user ? mapProfile(result.user) : null, error: null };
}

export async function login(username: string, password: string): Promise<User | null> {
  // Try username@mandoob.app format
  const email = `${username.replace(/\s+/g, "_")}@mandoob.app`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  return await getProfileById(data.user.id);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return await getProfileById(user.id);
}

export async function getProfileById(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) { console.error("getUsers error:", error); return []; }
  return (data || []).map(mapProfile);
}

export async function addUser(user: { username: string; password: string; displayName: string; role: UserRole; branchId?: string }): Promise<{ user: User | null; error: string | null }> {
  return await signUp(user.username, user.password, user.displayName, user.role, user.branchId);
}

export async function deleteUserAdmin(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ userId: id }),
  });
}

export async function updateUser(id: string, updates: Partial<User & { password?: string }>): Promise<void> {
  const profileUpdate: any = {};
  if (updates.displayName) profileUpdate.display_name = updates.displayName;
  if (updates.username) profileUpdate.username = updates.username;
  if (updates.role) profileUpdate.role = updates.role;
  if (updates.managerName !== undefined) profileUpdate.manager_name = updates.managerName;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", id);
    if (error) console.error("updateUser error:", error);
  }

  // Update role in user_roles if role changed
  if (updates.role) {
    await supabase.from("user_roles").delete().eq("user_id", id);
    await supabase.from("user_roles").insert({ user_id: id, role: updates.role });
  }
}

export async function deleteUser(id: string): Promise<void> {
  // Delete profile (cascade will handle auth user cleanup)
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) console.error("deleteUser error:", error);
}

export async function saveManagerName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ manager_name: name }).eq("id", userId);
  if (error) console.error("saveManagerName error:", error);
}

export async function getManagerName(userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("manager_name").eq("id", userId).maybeSingle();
  return data?.manager_name || null;
}
