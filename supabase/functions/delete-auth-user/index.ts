import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client using service role key (stored as Supabase secret)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller's JWT is valid and get their user info
    const callerToken = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(callerToken);
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: Only allow the admin email to call this function
    const ADMIN_EMAIL = "balamuruganprabakar@gmail.com";
    if (caller.email !== ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the userId to delete from request body
    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own admin account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete the auth user (this fully removes login access)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      if (deleteError.message?.toLowerCase().includes("user not found")) {
        return new Response(
          JSON.stringify({ success: true, message: `User already deleted or not found in auth.` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: `User ${userId} auth account deleted.` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
