import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Gift, Mail, CheckCircle } from "lucide-react";

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState<"parent" | "provider">("parent");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get tab and referral code from URL params
  const defaultTab = searchParams.get('tab') || 'signup';
  const referralCode = searchParams.get('ref');

  // Auth state management
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // Defer navigation to prevent deadlocks
          setTimeout(async () => {
            const userType = session.user.user_metadata?.user_type;
            
            // Check if user has completed onboarding
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name")
                .eq("user_id", session.user.id)
                .single();
              
              const { data: parentProfile } = await supabase
                .from("parent_profiles")
                .select("location")
                .eq("user_id", session.user.id)
                .single();
              
              const hasCompletedOnboarding = profile?.first_name && 
                                             profile?.last_name && 
                                             (userType !== 'parent' || parentProfile?.location);
              
              if (!hasCompletedOnboarding && userType) {
                // User hasn't completed onboarding - redirect there
                console.log("User needs onboarding - redirecting with type:", userType);
                navigate(`/onboarding?type=${userType}`, { replace: true });
                toast({
                  title: "Welcome!",
                  description: "Let's complete your profile setup",
                });
              } else {
                // User has completed onboarding - go to dashboard
                console.log("User onboarding complete - redirecting to dashboard");
                navigate('/dashboard', { replace: true });
                toast({
                  title: "Welcome back!",
                  description: "Successfully signed in",
                });
              }
            } catch (error) {
              // If we can't check, redirect to onboarding to be safe
              if (userType) {
                navigate(`/onboarding?type=${userType}`, { replace: true });
              } else {
                navigate('/dashboard', { replace: true });
              }
            }
          }, 100);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If already authenticated, check onboarding status before redirecting
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type, first_name, last_name")
            .eq("user_id", session.user.id)
            .single();

          if (profile?.user_type) {
            const hasBasicInfo = profile.first_name && profile.last_name;
            
            if (!hasBasicInfo) {
              // User hasn't completed basic onboarding yet
              navigate(`/onboarding?type=${profile.user_type}`);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking profile:", error);
        }
        
        // User exists and has completed basic info, go to home
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Cleanup auth state utility
  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Sign out error (continuing):", err);
      }

      // Redirect to onboarding after email verification
      const redirectUrl = `${window.location.origin}/onboarding?type=${userType}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            user_type: userType,
            referral_code: referralCode || null,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Clear form and show success state
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setSignupSuccess(true);
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Sign out error (continuing):", err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Force page reload for clean state - go to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, redirect
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="text-3xl transform scale-x-[-1]">🏃‍♀️</div>
            <span className="text-2xl font-bold text-primary">KidFun</span>
          </Link>
          <p className="text-muted-foreground mt-2">Secure access to your account</p>
          {referralCode && (
            <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
              <Gift className="w-3 h-3 mr-1" />
              You've been invited! Sign up for bonus points
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="space-y-4">
                {signupSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Check Your Email!</h3>
                      <p className="text-muted-foreground mt-2">
                        We've sent a verification link to your email address. Click the link to activate your account.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <Mail className="w-4 h-4" />
                      <span>Don't see it? Check your spam folder.</span>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSignupSuccess(false)}
                      className="mt-4"
                    >
                      Back to Sign Up
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>I am a:</Label>
                      <RadioGroup
                        value={userType}
                        onValueChange={(value: "parent" | "provider") => setUserType(value)}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="parent" id="parent" />
                          <Label htmlFor="parent">Parent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="provider" id="provider" />
                          <Label htmlFor="provider">Provider</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-sm text-muted-foreground hover:text-primary"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
