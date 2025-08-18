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
    
    // For now, just log that we received the request and return success
    // This bypasses any Resend issues to test the basic webhook
    console.log("Auth hook received for:", user.email, "Type:", email_data.email_action_type);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Auth hook processed successfully",
      user_email: user.email,
      action_type: email_data.email_action_type
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Auth hook error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);