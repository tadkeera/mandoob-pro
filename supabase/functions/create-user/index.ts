import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Verify the caller is an admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: callerRole } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (!callerRole || callerRole.role !== "admin") {
    return new Response(JSON.stringify({ error: "Only admins can create users" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { username, password, displayName, role, branchId } = await req.json();

  if (!username || !password || !role) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = `${username.replace(/\s+/g, "_")}@mandoob.app`;

  // Check if username already exists
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: "اسم المستخدم مستخدم بالفعل" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create auth user with service role (no email verification needed, no session change)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: displayName || username,
      role,
    },
  });

  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message || "فشل إنشاء المستخدم" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = data.user.id;

  // Update profile with correct role and branch
  const profileUpdate: Record<string, string> = { role };
  if (branchId) profileUpdate.branch_id = branchId;

  await supabaseAdmin.from("profiles").update(profileUpdate).eq("id", userId);

  // Insert into user_roles
  await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id" });

  // Fetch the created profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return new Response(
    JSON.stringify({ success: true, user: profile }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
