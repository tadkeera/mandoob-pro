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

export async function signUp(username: string, password: string, displayName: string, role: UserRole = "representative"): Promise<{ user: User | null; error: string | null }> {
  // Use username@mandoob.app as email internally
  const email = `${username.replace(/\s+/g, "_")}@mandoob.app`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName, role },
    },
  });
  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: "فشل إنشاء الحساب" };

  // Grant role in user_roles table
  await supabase.from("user_roles").insert({ user_id: data.user.id, role });

  const profile = await getProfileById(data.user.id);
  return { user: profile, error: null };
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

export async function addUser(user: { username: string; password: string; displayName: string; role: UserRole }): Promise<User | null> {
  const result = await signUp(user.username, user.password, user.displayName, user.role);
  return result.user;
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
