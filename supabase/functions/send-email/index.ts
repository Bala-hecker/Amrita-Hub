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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid caller token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ADMIN_EMAIL = "balamuruganprabakar@gmail.com";
    if (caller.email !== ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get body parameters
    const { to, type, userName, extra } = await req.json();
    if (!to || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters (to, type)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY secret not found on Supabase. Configure it in Dashboard -> Secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare email HTML and Subject based on notification type
    let subject = "";
    let htmlContent = "";

    const cleanName = userName || "Student";

    if (type === "ban") {
      subject = "⚠️ Account Suspension Notice | Amrita Hub";
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #C0003C; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 0.5px;">Amrita Hub</h1>
          </div>
          <div style="padding: 24px; background: #ffffff; color: #334155;">
            <h3 style="margin-top: 0; font-size: 1.2rem; color: #0f172a;">Account Suspension</h3>
            <p>Dear ${cleanName},</p>
            <p>We are writing to inform you that your account at <strong>Amrita Hub</strong> has been suspended by an administrator due to a violation of our community standards.</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <strong>Reason for suspension:</strong><br/>
              <span style="color: #64748b; font-style: italic;">"${extra || "Policy violation / spamming activities."}"</span>
            </div>

            <p style="margin-bottom: 0;">If you believe this was an error, please reach out to the campus administrator directly.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 0.78rem; color: #64748b; border-top: 1px solid #e2e8f0;">
            This is an automated notification from Amrita School of Engineering CSE Portal.
          </div>
        </div>
      `;
    } else if (type === "unban") {
      subject = "✅ Account Restored | Amrita Hub";
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #059669; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 0.5px;">Amrita Hub</h1>
          </div>
          <div style="padding: 24px; background: #ffffff; color: #334155;">
            <h3 style="margin-top: 0; font-size: 1.2rem; color: #0f172a;">Welcome Back!</h3>
            <p>Dear ${cleanName},</p>
            <p>We are pleased to inform you that your suspension has been lifted, and your account access to <strong>Amrita Hub</strong> has been fully restored.</p>
            <p>You can now log in, view curriculum notes, practice keys, and download shared files as usual.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://amritahub.vercel.app" style="background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.9rem;">Go to Amrita Hub</a>
            </div>
            
            <p style="margin-bottom: 0;">Thank you for your patience.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 0.78rem; color: #64748b; border-top: 1px solid #e2e8f0;">
            This is an automated notification from Amrita School of Engineering CSE Portal.
          </div>
        </div>
      `;
    } else if (type === "delete") {
      subject = "🗑️ Account Deletion Notice | Amrita Hub";
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #475569; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 0.5px;">Amrita Hub</h1>
          </div>
          <div style="padding: 24px; background: #ffffff; color: #334155;">
            <h3 style="margin-top: 0; font-size: 1.2rem; color: #0f172a;">Profile Deleted</h3>
            <p>Dear ${cleanName},</p>
            <p>This email is to notify you that your user profile and all associated data at <strong>Amrita Hub</strong> have been permanently deleted by the administrator.</p>
            <p>If you wish to re-join the community, you must create a new account using your institutional email address.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 0.78rem; color: #64748b; border-top: 1px solid #e2e8f0;">
            This is an automated notification from Amrita School of Engineering CSE Portal.
          </div>
        </div>
      `;
    } else if (type === "approved") {
      subject = "🌟 Shared Resource Approved | Amrita Hub";
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: #C0003C; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 0.5px;">Amrita Hub</h1>
          </div>
          <div style="padding: 24px; background: #ffffff; color: #334155;">
            <h3 style="margin-top: 0; font-size: 1.2rem; color: #0f172a;">Material Approved</h3>
            <p>Dear ${cleanName},</p>
            <p>Thank you for contributing! Your shared resource has been reviewed and approved by the campus moderator. It is now visible to all students in the main catalog.</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #C0003C; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <strong>Approved Resource:</strong><br/>
              <span style="color: #0f172a; font-weight: 700;">"${extra || "Shared Document"}"</span>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://amritahub.vercel.app" style="background: #C0003C; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.9rem;">View Feed</a>
            </div>
            
            <p style="margin-bottom: 0;">Your contribution helps your fellow peers study smarter!</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 0.78rem; color: #64748b; border-top: 1px solid #e2e8f0;">
            This is an automated notification from Amrita School of Engineering CSE Portal.
          </div>
        </div>
      `;
    }

    // Call Resend REST API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: "AmritaHub <noreply@resend.dev>",
        to: [to],
        subject: subject,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const resErr = await res.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: resErr.message || "Failed to send email via Resend API" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resData = await res.json();
    return new Response(
      JSON.stringify({ success: true, messageId: resData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
