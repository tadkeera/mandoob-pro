import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const username = "waleed";
  const password = "WALEED770976667YAMAN";
  const email = `${username}@mandoob.app`;
  const displayName = "وليد";

  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ message: "Admin already exists", id: existing.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName, role: "admin" },
  });

  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message || "Failed to create user" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update profile role to admin (trigger creates it as representative by default)
  await supabaseAdmin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user.id);

  // Insert into user_roles
  await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: data.user.id, role: "admin" });

  return new Response(
    JSON.stringify({ success: true, message: "Admin created successfully", id: data.user.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
