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
    // Create the correct verification URL that redirects back to your app
    const confirmationUrl = `https://vjyzhgwiajobfpumeqvy.supabase.co/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=https://kidfun.app/`;

      console.log("Sending email to:", user.email);
      const emailResponse = await resend.emails.send({
        from: "KidFun <noreply@kidfun.app>", // Use your verified domain
        to: [user.email],
        subject: "Welcome to KidFun - Verify Your Email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to KidFun!</h1>
              <p style="color: #f1f3f4; margin: 10px 0 0 0; font-size: 16px;">Your journey to amazing activities starts here</p>
            </div>
            
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #2d3748; margin-bottom: 20px;">Hi ${firstName}! 👋</h2>
              
              <p style="margin-bottom: 25px; font-size: 16px; line-height: 1.8;">
                Thanks for joining KidFun! We're excited to help you discover amazing activities and camps for your children.
              </p>
              
              <p style="margin-bottom: 30px; font-size: 16px; line-height: 1.8;">
                To get started, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${confirmationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 16px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px; 
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; color: #718096; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmationUrl}" style="color: #667eea; word-break: break-all;">${confirmationUrl}</a>
              </p>
              
              <p style="font-size: 14px; color: #718096; margin-top: 20px;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #718096; font-size: 14px;">
              <p>© 2024 KidFun. Connecting families to amazing experiences.</p>
            </div>
          </div>
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