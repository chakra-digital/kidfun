import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle, Loader2, ArrowRight, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EmailCaptureProps {
  className?: string;
}

const EmailCapture = ({ className = "" }: EmailCaptureProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth();

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
          inviterName: user ? "A KidFun parent" : "KidFun",
          inviterEmail: user?.email || "hello@kidfun.app",
          inviteType: user ? "parent_invite" : "homepage_capture"
        }
      });

      if (error) throw error;

      setIsSuccess(true);
      setEmail("");
      toast.success(user ? "Invite sent! They'll receive an email shortly." : "Invite sent! Check your inbox.");
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-secondary/10 border border-secondary/20 ${className}`}>
        <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-secondary" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground">
            {user ? "Invite sent!" : "Check your inbox!"}
          </p>
          <p className="text-sm text-muted-foreground">
            {user 
              ? "They'll receive an invite to join your network."
              : "We sent you an invite to join KidFun."
            }
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsSuccess(false)}
          className="mt-2"
        >
          {user ? "Invite another parent" : "Send to another email"}
        </Button>
      </div>
    );
  }

  // Show "Invite Parents" CTA for logged-in users
  if (user) {
    return (
      <div className={`${className}`}>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter their email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-12 bg-card border-border/60 focus-visible:border-primary"
              disabled={isSubmitting}
            />
          </div>
          <Button 
            type="submit" 
            size="lg"
            disabled={isSubmitting}
            className="h-12 px-6 font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Invite Parents
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground text-center mt-4">
          We'll send them an invite so you can start coordinating activities
        </p>
      </div>
    );
  }

  // Show original email capture for logged-out users
  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-12 bg-card border-border/60 focus-visible:border-primary"
            disabled={isSubmitting}
          />
        </div>
        <Button 
          type="submit" 
          size="lg"
          disabled={isSubmitting}
          className="h-12 px-6 font-semibold gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground text-center mt-4">
        We'll send you an invite to create your free account
      </p>
    </div>
  );
};

export default EmailCapture;
