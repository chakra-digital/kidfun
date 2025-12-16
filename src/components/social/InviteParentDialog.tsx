import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Copy, Check, Send, Gift, Users } from 'lucide-react';

interface InviteParentDialogProps {
  children: React.ReactNode;
}

export const InviteParentDialog: React.FC<InviteParentDialogProps> = ({ children }) => {
  const { user } = useAuth();
  const { userProfile, parentProfile } = useUserProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralCode = parentProfile?.referral_code;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kidfun.app';
  const inviteLink = referralCode 
    ? `${baseUrl}/auth?ref=${referralCode}`
    : `${baseUrl}/auth`;

  const inviterName = userProfile?.first_name 
    ? `${userProfile.first_name}${userProfile.last_name ? ' ' + userProfile.last_name : ''}`
    : undefined;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share it with your friends" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Couldn't copy", description: "Please copy manually", variant: "destructive" });
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          inviteeEmail: email,
          inviterName,
          inviterEmail: user?.email,
          referralCode,
          inviteType: 'app_invite',
        },
      });

      if (error) throw error;

      toast({
        title: "Invite sent! 🎉",
        description: data.message || "They'll receive an email shortly",
      });

      setEmail('');
      // Keep dialog open so they can invite more
    } catch (err: any) {
      console.error("Invite error:", err);
      toast({
        title: "Couldn't send invite",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Invite Parents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Points incentive */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Earn 15 points per invite!</p>
                <p className="text-xs text-muted-foreground">
                  When they sign up, you both get rewarded
                </p>
              </div>
            </div>
          </div>

          {/* Email invite form */}
          <form onSubmit={handleSendInvite} className="space-y-3">
            <Label htmlFor="invite-email">Send invite by email</Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="friend@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !email}>
                {sending ? (
                  <span className="animate-pulse">Sending...</span>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or share link</span>
            </div>
          </div>

          {/* Copy link */}
          <div className="space-y-2">
            <Label>Your personal invite link</Label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="text-xs bg-muted"
              />
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {referralCode && (
              <p className="text-xs text-muted-foreground">
                Referral code: <span className="font-mono font-medium">{referralCode}</span>
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
