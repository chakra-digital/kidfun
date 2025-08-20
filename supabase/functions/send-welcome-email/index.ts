import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  userType: 'parent' | 'provider';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userType }: WelcomeEmailRequest = await req.json();
    
    console.log("Sending welcome email for user:", userId, "Type:", userType);

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
    }

    const firstName = profile.first_name || 'there';
    const isParent = userType === 'parent';

    const subject = `Welcome to KidFun, ${firstName}! Your profile is all set 🎉`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to KidFun</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 You're All Set!</h1>
          <p style="color: #f1f3f4; margin: 10px 0 0 0; font-size: 16px;">Welcome to the KidFun community</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #2d3748; margin-bottom: 20px;">Congratulations, ${firstName}! 🎊</h2>
          
          <p style="margin-bottom: 25px; font-size: 16px; line-height: 1.8;">
            Your KidFun profile is now complete and you're ready to ${isParent ? 'discover amazing activities for your children' : 'showcase your programs to families'}!
          </p>
          
          ${isParent ? `
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #0c4a6e; margin-bottom: 15px; font-size: 18px;">🔍 Start Exploring</h3>
            <p style="margin: 0; color: #0c4a6e;">
              Browse hundreds of local activities, camps, and programs. Filter by age, interests, and location to find the perfect fit for your family.
            </p>
          </div>
          
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #14532d; margin-bottom: 15px; font-size: 18px;">📅 Easy Booking</h3>
            <p style="margin: 0; color: #14532d;">
              Book activities with just a few clicks. Manage all your bookings in one place and get reminders before each event.
            </p>
          </div>
          ` : `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #92400e; margin-bottom: 15px; font-size: 18px;">🏢 Showcase Your Programs</h3>
             <p style="margin: 0; color: #92400e;">
               Your profile is now live! Families can discover your programs and book directly through KidFun.
             </p>
          </div>
          
          <div style="background: #f3e8ff; border-left: 4px solid #a855f7; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #581c87; margin-bottom: 15px; font-size: 18px;">📊 Manage Bookings</h3>
            <p style="margin: 0; color: #581c87;">
              Use your dashboard to manage bookings, update programs, and connect with families in your community.
            </p>
          </div>
          `}
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://vjyzhgwiajobfpumeqvy.supabase.co/" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                      margin-right: 15px;">
              ${isParent ? 'Start Exploring' : 'Go to Dashboard'}
            </a>
          </div>
          
          <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 18px;">💡 Pro Tips</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
              ${isParent ? `
              <li style="margin-bottom: 8px;">Save activities to your wishlist for easy access later</li>
              <li style="margin-bottom: 8px;">Set up notifications for new programs in your area</li>
              <li style="margin-bottom: 8px;">Read reviews from other parents before booking</li>
              <li>Connect with other families in your community</li>
              ` : `
              <li style="margin-bottom: 8px;">Upload high-quality photos to attract more families</li>
              <li style="margin-bottom: 8px;">Keep your program schedules updated</li>
              <li style="margin-bottom: 8px;">Respond quickly to parent inquiries</li>
              <li>Encourage satisfied families to leave reviews</li>
              `}
            </ul>
          </div>
          
           <p style="font-size: 16px; color: #4a5568; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
             Questions? Reply to this email or visit our help center. We're here to help you make the most of KidFun!
           </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #718096; font-size: 14px;">
          <p>© 2024 KidFun. Connecting families to amazing experiences.</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Unsubscribe</a> |
            <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Update Preferences</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "KidFun <welcome@resend.dev>",
      to: [profile.email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);