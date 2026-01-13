import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Search, CalendarDays, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type PathMode = "circle" | "discover" | "plan";

const pathCards = [
  {
    id: "circle" as PathMode,
    icon: Users,
    title: "Circle",
    subtitle: "Connect with parents",
    description: "Build your trusted network of families from your school and neighborhood.",
    cta: "Find Parents",
    path: "/find-parents",
    gradient: "from-rose-500 to-orange-400",
  },
  {
    id: "discover" as PathMode,
    icon: Search,
    title: "Discover",
    subtitle: "Find activities",
    description: "Search our curated database of verified providers and experiences.",
    cta: "Start Searching",
    path: "/activities",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    id: "plan" as PathMode,
    icon: CalendarDays,
    title: "Plan",
    subtitle: "Coordinate together",
    description: "Organize carpools, group activities, and shared schedules with your circle.",
    cta: "Open Planner",
    path: "/dashboard",
    gradient: "from-emerald-500 to-teal-400",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<PathMode>("discover");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow pb-20 md:pb-0">
        {/* Hero Section - Minimal & Clean */}
        <section className="relative py-12 md:py-20 lg:py-28">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Your family's activity network
              </div>
              
              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
                Parenting is better{" "}
                <span className="text-primary">together</span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Connect with families at your school, discover trusted activities, 
                and coordinate schedules—all in one place.
              </p>

              {/* Mode Toggle - Airbnb style */}
              <div className="inline-flex items-center p-1 rounded-full bg-muted/80 backdrop-blur-sm border mb-10">
                {pathCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setActiveMode(card.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                      activeMode === card.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Cards - 3 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {pathCards.map((card) => {
                const isActive = activeMode === card.id;
                return (
                  <Card
                    key={card.id}
                    className={cn(
                      "group relative overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      isActive
                        ? "border-primary shadow-lg scale-[1.02]"
                        : "border-transparent hover:border-primary/30 hover:shadow-md"
                    )}
                    onClick={() => {
                      setActiveMode(card.id);
                      navigate(card.path);
                    }}
                  >
                    {/* Gradient accent bar */}
                    <div className={cn(
                      "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                      card.gradient
                    )} />
                    
                    <CardContent className="p-6">
                      {/* Icon */}
                      <div className={cn(
                        "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br",
                        card.gradient
                      )}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-xl font-semibold mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{card.subtitle}</p>
                      <p className="text-sm text-foreground/80 mb-4">{card.description}</p>
                      
                      {/* CTA */}
                      <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                        {card.cta}
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick action based on active mode */}
            <div className="mt-10 text-center">
              <Button
                size="lg"
                onClick={() => navigate(pathCards.find(c => c.id === activeMode)?.path || "/activities")}
                className="px-8 h-12 text-base font-medium"
              >
                {pathCards.find(c => c.id === activeMode)?.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Trust indicators - Minimal */}
        <section className="py-12 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-muted-foreground">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-sm">Verified Providers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">1,000+</p>
                <p className="text-sm">Active Families</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">50+</p>
                <p className="text-sm">Schools Connected</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
