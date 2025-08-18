import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  user: {
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== Auth Hook Function Started ===");
  console.log("Method:", req.method);
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing POST request for auth email");
    
    // Get and parse the payload
    const payload = await req.text();
    console.log("Payload length:", payload.length);
    
    const { user, email_data }: AuthEmailRequest = JSON.parse(payload);
    
    console.log("User email:", user.email);
    console.log("Email action type:", email_data.email_action_type);

    const firstName = user.user_metadata?.first_name || 'there';
    const confirmationUrl = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

    const subject = "Welcome to KidFun - Verify Your Email";
    const htmlContent = `
      <h1>Welcome to KidFun, ${firstName}!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${confirmationUrl}">Verify Email</a>
      <p>If the link doesn't work, copy and paste this URL: ${confirmationUrl}</p>
    `;

    console.log("Sending email to:", user.email);
    console.log("RESEND_API_KEY exists:", !!Deno.env.get("RESEND_API_KEY"));

    const emailResponse = await resend.emails.send({
      from: "KidFun <onboarding@resend.dev>",
      to: [user.email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);