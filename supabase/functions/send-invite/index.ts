import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  inviteeEmail: string;
  inviterName?: string;
  inviterEmail?: string;
  referralCode?: string;
  inviteType?: 'app_invite' | 'notify_me';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteeEmail, inviterName, inviterEmail, referralCode, inviteType = 'app_invite' }: InviteRequest = await req.json();

    console.log("Processing invite request:", { inviteeEmail, inviterName, referralCode, inviteType });

    // Validate email
    if (!inviteeEmail || !inviteeEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Valid email address required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists as a user
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('email, user_id')
      .eq('email', inviteeEmail.toLowerCase())
      .limit(1);

    const userExists = existingUsers && existingUsers.length > 0;
    console.log("User exists check:", userExists);

    // Build invite link
    // Use the calling site's origin when available so links work in both staging and production.
    const fallbackBaseUrl = "https://kidfun.app";
    const origin = req.headers.get("origin");
    const baseUrl = (origin && /^https?:\/\//.test(origin) ? origin : fallbackBaseUrl).replace(/\/$/, "");

    const inviteLink = referralCode
      ? `${baseUrl}/auth?ref=${referralCode}`
      : `${baseUrl}/auth`;

    // Personalized email content
    let subject: string;
    let htmlContent: string;

    if (userExists) {
      // User already signed up - send a "your friend is on KidFun" email
      subject = inviterName 
        ? `${inviterName} wants to connect with you on KidFun!`
        : "A friend invited you to connect on KidFun!";
      
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1; margin-bottom: 24px;">🏃‍♀️ KidFun</h1>
          <h2 style="color: #1f2937;">You've got a connection request!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            ${inviterName ? `<strong>${inviterName}</strong>` : 'A fellow parent'} is already using KidFun and wants to coordinate activities with you!
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Log in to see their profile and start sharing activities.
          </p>
          <a href="${baseUrl}/dashboard" 
             style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px;">
            Open KidFun
          </a>
        </div>
      `;
    } else {
      // New user invite
      subject = inviterName 
        ? `${inviterName} invited you to join KidFun!`
        : "You're invited to join KidFun!";
      
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1; margin-bottom: 24px;">🏃‍♀️ KidFun</h1>
          <h2 style="color: #1f2937;">You're invited!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            ${inviterName ? `<strong>${inviterName}</strong>` : 'A fellow parent'} thinks you'd love KidFun - the easiest way to discover and coordinate kids' activities with other parents.
          </p>
          <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
            <li>🔍 Discover amazing activities for your kids</li>
            <li>👨‍👩‍👧‍👦 Connect with parents from your school</li>
            <li>📅 Coordinate carpools and group activities</li>
            <li>⭐ Earn points and rewards</li>
          </ul>
          <a href="${inviteLink}" 
             style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px;">
            Join KidFun Free
          </a>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
            ${referralCode ? `Use referral code: <strong>${referralCode}</strong> for bonus points!` : ''}
          </p>
        </div>
      `;
    }

    // Send email
    const emailResponse = await resend.emails.send({
      // IMPORTANT: Must be a sender on your verified domain (Resend will block resend.dev senders in production)
      from: "KidFun <noreply@kidfun.app>",
      to: [inviteeEmail],
      subject,
      html: htmlContent,
    });

    // Resend SDK may return either { id } or { data, error } depending on version.
    const resendError = (emailResponse as any)?.error;
    if (resendError) {
      console.error("Resend error:", resendError);

      // Record the failed invite attempt (best-effort)
      await supabase.from('referral_invites').insert({
        inviter_user_id: null,
        inviter_email: inviterEmail || null,
        invitee_email: inviteeEmail.toLowerCase(),
        referral_code: referralCode || null,
        invite_type: inviteType,
        status: 'failed',
      });

      return new Response(
        JSON.stringify({ error: resendError.message || "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent:", emailResponse);

    // Get inviter user ID from auth header if available
    let inviterUserId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      inviterUserId = user?.id || null;
    }

    // Record the invite
    const { error: insertError } = await supabase
      .from('referral_invites')
      .insert({
        inviter_user_id: inviterUserId,
        inviter_email: inviterEmail || null,
        invitee_email: inviteeEmail.toLowerCase(),
        referral_code: referralCode || null,
        invite_type: inviteType,
        status: userExists ? 'user_exists' : 'sent',
      });

    if (insertError) {
      console.error("Error recording invite:", insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userExists,
        message: userExists 
          ? "They're already on KidFun! We sent them a heads up."
          : "Invite sent! They'll get bonus points when they sign up."
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
