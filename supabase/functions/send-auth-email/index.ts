import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the webhook payload
    const payload = await req.text();
    const { user, email_data } = JSON.parse(payload);
    
    console.log("Auth hook received for:", user.email, "Type:", email_data.email_action_type);
    
    // Check if RESEND_API_KEY exists
    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY exists:", !!resendKey);
    console.log("RESEND_API_KEY starts with:", resendKey?.substring(0, 10) + "...");
    
    if (!resendKey) {
      console.error("RESEND_API_KEY not found!");
      return new Response(JSON.stringify({ 
        success: false,
        error: "RESEND_API_KEY not configured"
      }), {
        status: 200, // Return 200 so signup still works
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try to import and use Resend
    try {
      console.log("Importing Resend...");
      const { Resend } = await import("npm:resend@2.0.0");
      
      console.log("Creating Resend instance...");
      const resend = new Resend(resendKey);
      
      const firstName = user.user_metadata?.first_name || 'there';
      const confirmationUrl = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

      console.log("Sending email to:", user.email);
      const emailResponse = await resend.emails.send({
        from: "KidFun <onboarding@resend.dev>",
        to: [user.email],
        subject: "Welcome to KidFun - Verify Your Email",
        html: `
          <h1>Welcome to KidFun, ${firstName}!</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${confirmationUrl}">Verify Email Address</a>
          <p>If the link doesn't work, copy and paste this URL: ${confirmationUrl}</p>
        `,
      });
      
      console.log("Email sent successfully:", emailResponse);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: "Email sent successfully",
        email_id: emailResponse.data?.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
      
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError.message);
      console.error("Email error details:", emailError);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `Email failed: ${emailError.message}`
      }), {
        status: 200, // Return 200 so signup still works
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("General auth hook error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);