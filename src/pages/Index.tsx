import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  Users, 
  Search, 
  CalendarDays, 
  ArrowRight, 
  Sparkles, 
  Heart,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import ConversationalSearch from "@/components/search/ConversationalSearch";
import CoordinationTeaser from "@/components/home/CoordinationTeaser";
import CategoryTiles from "@/components/home/CategoryTiles";
import { SocialConnectionsCard } from "@/components/social/SocialConnectionsCard";

type PathMode = "circle" | "discover" | "plan";

const pathCards = [
  {
    id: "circle" as PathMode,
    icon: Users,
    title: "Circle",
    subtitle: "Build your network",
    headline: "Your trusted parent network",
    description: "Connect with families at your school. Coordinate playdates, carpools, and activities together.",
    cta: "Find Parents",
    ctaLoggedIn: "My Circle",
    pathLoggedOut: "#circle-preview",
    pathLoggedIn: "/dashboard#connections",
    accentClass: "from-rose-500 to-orange-400",
    bgClass: "bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30",
  },
  {
    id: "discover" as PathMode,
    icon: Search,
    title: "Discover",
    subtitle: "Find activities",
    headline: "Activities your kids will love",
    description: "Search our curated database of verified camps, classes, and enrichment programs.",
    cta: "Start Searching",
    ctaLoggedIn: "Search Activities",
    pathLoggedOut: "/activities",
    pathLoggedIn: "/activities",
    accentClass: "from-violet-500 to-purple-400",
    bgClass: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
  },
  {
    id: "plan" as PathMode,
    icon: CalendarDays,
    title: "Plan",
    subtitle: "Coordinate together",
    headline: "Plan activities with friends",
    description: "Organize group activities, pick times together, and track who's going.",
    cta: "See How It Works",
    ctaLoggedIn: "My Plans",
    pathLoggedOut: "#plan-preview",
    pathLoggedIn: "/dashboard#coordination",
    accentClass: "from-emerald-500 to-teal-400",
    bgClass: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const searchRef = useRef<{ triggerSearch: (query: string) => void }>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Handle scroll-to from BottomNav navigation
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(state.scrollTo!);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCardClick = (card: typeof pathCards[0]) => {
    const path = isLoggedIn ? card.pathLoggedIn : card.pathLoggedOut;
    
    if (card.id === "discover") {
      // Always scroll to search section for discover
      setShowSearch(true);
      setTimeout(() => {
        document.getElementById('discover')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } else if (path.startsWith('#')) {
      // Scroll to section on this page
      const sectionId = path.replace('#', '');
      document.getElementById(sectionId)?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else if (path.includes('#')) {
      // Navigate to page with hash
      navigate(path.split('#')[0], { state: { scrollTo: path.split('#')[1] } });
    } else {
      navigate(path);
    }
  };

  const handleCategoryClick = (query: string) => {
    setShowSearch(true);
    setTimeout(() => {
      searchRef.current?.triggerSearch(query);
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow pb-20 md:pb-0">
        {/* Hero Section - Apple clean */}
        <section className="relative pt-8 pb-12 md:pt-16 md:pb-20">
          <div className="container mx-auto px-4">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Your family's activity network
              </div>
            </div>
            
            {/* Headline - Apple typography */}
            <div className="text-center mb-10 md:mb-14">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-4">
                Parenting is better{" "}
                <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
                  together
                </span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Connect with families, discover activities, and coordinate schedules—all in one place.
              </p>
            </div>

            {/* Apple-style Feature Cards Carousel */}
            <div className="relative max-w-6xl mx-auto">
              {/* Desktop: Show all 3, Mobile: Carousel */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {pathCards.map((card) => (
                  <FeatureCard 
                    key={card.id} 
                    card={card} 
                    isLoggedIn={isLoggedIn}
                    onClick={() => handleCardClick(card)} 
                  />
                ))}
              </div>

              {/* Mobile Carousel */}
              <div className="md:hidden">
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2">
                    {pathCards.map((card) => (
                      <CarouselItem key={card.id} className="pl-2 basis-[85%]">
                        <FeatureCard 
                          card={card} 
                          isLoggedIn={isLoggedIn}
                          onClick={() => handleCardClick(card)} 
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* Navigation arrows */}
                  <div className="flex justify-center gap-2 mt-6">
                    <CarouselPrevious className="static translate-x-0 translate-y-0 h-10 w-10" />
                    <CarouselNext className="static translate-x-0 translate-y-0 h-10 w-10" />
                  </div>
                </Carousel>
              </div>
            </div>
          </div>
        </section>

        {/* Discover Section - Search + Categories */}
        <section id="discover" className="py-16 bg-gradient-to-b from-muted/30 to-background scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Discover Activities</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Search for classes, camps, and enrichment programs near you
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <ConversationalSearch 
                ref={searchRef}
                onResultsUpdate={(results) => {
                  // When results come in, navigate to Activities with them
                  if (results.length > 0 && !(results[0] as any)?.isLoading) {
                    navigate('/activities', { state: { searchResults: results } });
                  }
                }}
                onSearchStart={() => {
                  // Navigate immediately to Activities page to show loading state there
                  navigate('/activities');
                }}
                className=""
              />
            </div>

            {/* Category Tiles */}
            <CategoryTiles onCategoryClick={handleCategoryClick} />
          </div>
        </section>

        {/* Circle Preview Section - For logged out users */}
        <section id="circle-preview" className="py-16 bg-gradient-to-b from-background to-muted/30 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-medium mb-4">
                  <Users className="h-4 w-4" />
                  Parent Network
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Your Trusted Circle</h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Connect with families at your child's school. Share recommendations, coordinate carpools, and plan activities together.
                </p>
              </div>
              
              {/* Visual preview of connections */}
              <div className="relative">
                {/* Connection visualization */}
                <div className="flex justify-center items-center gap-4 mb-8">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 border-2 border-background flex items-center justify-center text-white font-semibold text-sm shadow-md"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-muted-foreground">+50 more parents</span>
                </div>

                {/* Feature highlights */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-2xl bg-background border shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-6 w-6 text-rose-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Find Parents</h3>
                    <p className="text-sm text-muted-foreground">Connect with families at your school or in your neighborhood</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-background border shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Share Recommendations</h3>
                    <p className="text-sm text-muted-foreground">See what activities other parents love and trust</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-background border shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                      <CalendarDays className="h-6 w-6 text-amber-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Coordinate Together</h3>
                    <p className="text-sm text-muted-foreground">Plan group activities and share schedules</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-10">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500"
                  >
                    Join Your Circle
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Plan Preview Section */}
        <section id="plan-preview" className="scroll-mt-20">
          <CoordinationTeaser />
        </section>

        {/* FunFund Section */}
        <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">KidFun FunFund</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Every activity booked helps fund experiences for kids and families in need.
                Together, we're making childhood memories accessible to everyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="px-6 py-3 rounded-xl bg-background border shadow-sm">
                  <p className="text-2xl font-bold text-primary">$0</p>
                  <p className="text-sm text-muted-foreground">Raised so far</p>
                </div>
                <div className="px-6 py-3 rounded-xl bg-background border shadow-sm">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Kids funded</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Coming soon: Learn how you can contribute to FunFund
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

// Apple-style Feature Card Component
interface FeatureCardProps {
  card: typeof pathCards[0];
  isLoggedIn: boolean;
  onClick: () => void;
}

const FeatureCard = ({ card, isLoggedIn, onClick }: FeatureCardProps) => {
  const Icon = card.icon;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-300",
        "border border-border/50 hover:border-border",
        "hover:shadow-lg hover:scale-[1.02]",
        card.bgClass,
        "min-h-[280px] md:min-h-[320px] flex flex-col"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5",
        "bg-gradient-to-br shadow-lg",
        card.accentClass
      )}>
        <Icon className="h-7 w-7 text-white" />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground mb-1">{card.subtitle}</p>
        <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">{card.headline}</h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {card.description}
        </p>
      </div>
      
      {/* CTA Button - Bottom right like Apple */}
      <div className="flex justify-end mt-4">
        <div className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-full",
          "bg-foreground/10 group-hover:bg-foreground/20 transition-colors"
        )}>
          <Plus className="h-5 w-5 text-foreground" />
        </div>
      </div>
    </div>
  );
};

export default Index;
