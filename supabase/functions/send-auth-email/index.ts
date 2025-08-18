import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  console.log("=== Function Starting ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Step 1: Getting payload");
    const payload = await req.text();
    console.log("Step 2: Payload received, length:", payload.length);
    
    console.log("Step 3: Parsing JSON");
    const { user, email_data }: AuthEmailRequest = JSON.parse(payload);
    console.log("Step 4: JSON parsed successfully");
    
    console.log("Step 5: Checking RESEND_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY exists:", !!resendKey);
    console.log("RESEND_API_KEY length:", resendKey?.length || 0);
    
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not found in environment");
    }
    
    console.log("Step 6: Importing Resend");
    const { Resend } = await import("npm:resend@2.0.0");
    console.log("Step 7: Resend imported successfully");
    
    console.log("Step 8: Creating Resend instance");
    const resend = new Resend(resendKey);
    console.log("Step 9: Resend instance created");

    const firstName = user.user_metadata?.first_name || 'there';
    const confirmationUrl = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

    console.log("Step 10: Attempting to send email");
    const emailResponse = await resend.emails.send({
      from: "KidFun <onboarding@resend.dev>",
      to: [user.email],
      subject: "Welcome to KidFun - Verify Your Email",
      html: `<h1>Welcome ${firstName}!</h1><p><a href="${confirmationUrl}">Verify Email</a></p>`,
    });
    console.log("Step 11: Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("=== ERROR OCCURRED ===");
    console.error("Error at step: Unknown");
    console.error("Error type:", typeof error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);