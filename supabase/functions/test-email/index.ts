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
    const { email } = await req.json();
    
    console.log("Testing email send to:", email);
    
    // Check if RESEND_API_KEY exists
    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY exists:", !!resendKey);
    
    if (!resendKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "RESEND_API_KEY not configured"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try to import and use Resend
    console.log("Importing Resend...");
    const { Resend } = await import("npm:resend@2.0.0");
    
    console.log("Creating Resend instance...");
    const resend = new Resend(resendKey);
    
    console.log("Sending test email...");
    const emailResponse = await resend.emails.send({
      from: "onboarding@resend.dev", // Use resend.dev domain for testing
      to: [email],
      subject: "Test Email from KidFun",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify Resend integration is working.</p>
        <p>If you received this, the email system is working correctly!</p>
      `,
    });
    
    console.log("Email response:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Test email sent successfully",
      response: emailResponse
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: any) {
    console.error("Test email error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Check logs for more information"
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);