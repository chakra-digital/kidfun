-- Create custom auth email templates function
CREATE OR REPLACE FUNCTION public.send_custom_auth_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_content TEXT;
  email_subject TEXT;
BEGIN
  -- Only customize signup confirmation emails
  IF NEW.email_change_confirm_status = 1 AND OLD.email_change_confirm_status IS DISTINCT FROM NEW.email_change_confirm_status THEN
    -- This is a signup confirmation
    email_subject := 'Welcome to KidFun - Confirm your email';
    email_content := format('
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3B82F6; margin: 0;">🏃‍♀️ KidFun</h1>
              <p style="color: #666; margin: 10px 0;">Find camps, activities and more</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Confirm your email address</h2>
              <p>Thanks for signing up! Please click the button below to confirm your email address and complete your registration.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Confirm Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                If the button doesn''t work, copy and paste this link into your browser:
                <br><a href="%s" style="color: #3B82F6;">%s</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #666; font-size: 14px;">
                If you didn''t create an account, you can safely ignore this email.
                <br><br>
                © 2024 KidFun, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    ', NEW.confirmation_token, NEW.confirmation_token, NEW.confirmation_token);
    
    -- Note: This function demonstrates the structure but actual email sending
    -- would need to be handled via Edge Functions with a service like Resend
  END IF;
  
  RETURN NEW;
END;
$$;