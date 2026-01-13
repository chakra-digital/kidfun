import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Download, Smartphone, Share, Plus, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Listen for the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Already Installed!</h1>
            <p className="text-muted-foreground mb-6">
              You're using the KidFun app. Enjoy!
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto px-4 py-12 max-w-lg">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🎈</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">Install KidFun</h1>
          <p className="text-muted-foreground text-lg">
            Add KidFun to your home screen for the best experience
          </p>
        </div>

        {/* Benefits */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-4">Why install?</h2>
            <ul className="space-y-3">
              {[
                "Launch instantly from your home screen",
                "Works offline for saved activities",
                "Faster loading and smoother experience",
                "Get notifications about activity updates",
                "No app store download needed",
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Install Instructions */}
        {isInstalled ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">Successfully Installed!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Find KidFun on your home screen
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Open App
              </Button>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          /* Chrome/Edge Install Button */
          <Button onClick={handleInstallClick} size="lg" className="w-full h-14 text-lg">
            <Download className="h-5 w-5 mr-2" />
            Install KidFun
          </Button>
        ) : isIOS ? (
          /* iOS Instructions */
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install on iPhone/iPad
              </h2>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Share className="h-4 w-4" /> at the bottom of Safari
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Plus className="h-4 w-4" /> in the share menu
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Tap "Add"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      KidFun will appear on your home screen
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        ) : isAndroid ? (
          /* Android Instructions (fallback if no prompt) */
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install on Android
              </h2>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Tap the menu button</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MoreVertical className="h-4 w-4" /> in Chrome (top right)
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Confirm by tapping "Install"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      KidFun will appear on your home screen
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        ) : (
          /* Desktop/Other */
          <Card>
            <CardContent className="pt-6 text-center">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-semibold mb-2">Best on Mobile</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Visit kidfun.app on your phone to install the app on your home screen.
              </p>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Continue to Website
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Skip link */}
        <div className="text-center mt-6">
          <Button variant="link" onClick={() => navigate('/')} className="text-muted-foreground">
            Continue without installing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
