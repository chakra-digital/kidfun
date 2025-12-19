import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

interface EmailCaptureProps {
  className?: string;
}

const EmailCapture = ({ className = "" }: EmailCaptureProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          inviteeEmail: trimmedEmail,
          inviterName: "KidFun",
          inviterEmail: "hello@kidfun.app",
          inviteType: "homepage_capture"
        }
      });

      if (error) throw error;

      setIsSuccess(true);
      setEmail("");
      toast.success("Invite sent! Check your inbox.");
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-primary/10 border border-primary/20 ${className}`}>
        <CheckCircle className="h-10 w-10 text-primary" />
        <p className="text-lg font-medium text-foreground">Check your inbox!</p>
        <p className="text-sm text-muted-foreground text-center">
          We sent you an invite to join KidFun.
        </p>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsSuccess(false)}
        >
          Send to another email
        </Button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary"
            disabled={isSubmitting}
          />
        </div>
        <Button 
          type="submit" 
          size="lg"
          disabled={isSubmitting}
          className="h-12 px-6 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Get Started Free"
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground text-center mt-3">
        We'll send you an invite to create your free account
      </p>
    </div>
  );
};

export default EmailCapture;
