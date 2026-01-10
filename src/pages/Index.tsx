import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ConversationalSearch from "@/components/search/ConversationalSearch";
import AIResultCard from "@/components/search/AIResultCard";
import AIResultModal from "@/components/search/AIResultModal";
import LocationMap from "@/components/maps/LocationMap";
import { SearchResultSkeletonList } from "@/components/search/SearchResultSkeleton";
import { Button } from "@/components/ui/button";
import type { AIResult } from "@/components/search/AIResultModal";
import { Heart, Shield, Lock, Users } from "lucide-react";
import CategoryTiles from "@/components/home/CategoryTiles";
import EmailCapture from "@/components/home/EmailCapture";
import CoordinationTeaser from "@/components/home/CoordinationTeaser";


// Mock data for camps

const Index = () => {
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [displayCount, setDisplayCount] = useState(5); // Show 5 initially
  const [showAIResults, setShowAIResults] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [selectedAIResult, setSelectedAIResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<{ triggerSearch: (query: string) => void }>(null);

  const handleSearchStart = () => {
    setIsLoadingResults(true);
    setShowAIResults(true);
    
    // Scroll to results section smoothly after brief delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }, 300);
  };

  const handleAIResultsUpdate = (results: any[]) => {
    console.log('AI Results received:', results);
    setAiResults(results);
    setDisplayCount(5); // Reset to show first 5 on new search
    setIsLoadingResults(false);
    setShowAIResults(results.length > 0);
    
    // Scroll to results when they load
    if (results.length > 0) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }, 100);
    }
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 5, aiResults.length));
  };

  const displayedResults = aiResults.slice(0, displayCount);
  const hasMoreResults = displayCount < aiResults.length;

  // Let the map component calculate its own center from providers

  const handleAIResultClick = (result: any) => {
    setSelectedAIResult(result);
    setIsModalOpen(true);
  };

  const handleCategoryClick = (query: string) => {
    // Set the query in the search component
    searchRef.current?.triggerSearch(query);
    
    // Scroll to search section
    const searchSection = document.querySelector('section');
    searchSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Focus on location input to prompt user
    setTimeout(() => {
      const locationInput = document.querySelector('input[placeholder="Where"]') as HTMLInputElement;
      if (locationInput) {
        locationInput.focus();
        // Add a visual highlight effect
        locationInput.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          locationInput.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section with AI Search */}
        <section className="relative text-white py-8 md:py-16 lg:py-24 min-h-[65svh] md:min-h-[70svh] flex items-center overflow-hidden">
          {/* Apple-inspired warm gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-400" />
          {/* Mesh gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-tl from-rose-400/30 via-transparent to-amber-300/20" />
          {/* Soft radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.3),transparent)]" />
          {/* Subtle noise texture for premium feel */}
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="container mx-auto px-3 md:px-4 relative z-10 w-full">
            <div className="max-w-4xl mx-auto text-center mb-6 md:mb-12">
              <h1 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 leading-tight text-white"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.4)'
                }}
              >
                Your family's activity network
              </h1>
              <p 
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-4 md:mb-8"
                style={{
                  textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                Connect with parents at your school, discover and coordinate activities together
              </p>
            </div>
            
            {/* AI Conversational Search */}
            <ConversationalSearch 
              ref={searchRef}
              onResultsUpdate={handleAIResultsUpdate}
              onSearchStart={handleSearchStart}
              className=""
            />
            
            {/* Quick Email Capture */}
            <div className="mt-8 md:mt-12">
              <EmailCapture />
            </div>
          </div>
        </section>

        {/* AI Results Section with Map */}
        {showAIResults && (
          <section ref={resultsRef} className="py-12 bg-background scroll-mt-20">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Search Results</h2>
                  <p className="text-muted-foreground mt-1">
                    {isLoadingResults ? 'Searching...' : `Found ${aiResults.length} relevant providers`}
                  </p>
                </div>
                {!isLoadingResults && (
                  <Button variant="outline" onClick={() => {
                    setShowAIResults(false);
                    setAiResults([]);
                  }}>
                    Clear Results
                  </Button>
                )}
              </div>

              {/* Sticky Tab Switcher for Mobile */}
              <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 mb-4 border-b shadow-sm">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => setViewMode('list')}
                    className="flex-1"
                  >
                    List View
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    onClick={() => setViewMode('map')}
                    className="flex-1"
                  >
                    Map View
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Results Cards - Left Side (Hidden on mobile when map view) */}
                <div className={`space-y-4 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-2 ${viewMode === 'map' ? 'hidden lg:block' : ''}`}>
                  {isLoadingResults ? (
                    <SearchResultSkeletonList count={5} />
                  ) : (
                    <>
                      {displayedResults.map((result, index) => (
                        <AIResultCard
                          key={`${result.id || result.google_place_id || 'idx'}-${index}`}
                          {...result}
                          onClick={() => handleAIResultClick(result)}
                        />
                      ))}
                      
                      {/* Load More Button */}
                      {hasMoreResults && (
                        <Button 
                          variant="outline" 
                          className="w-full py-6 text-base"
                          onClick={handleLoadMore}
                        >
                          Load More ({aiResults.length - displayCount} remaining)
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Map - Right Side (Full width on mobile when map view) */}
                <div className={`lg:sticky lg:top-24 h-[600px] lg:h-[calc(100vh-16rem)] rounded-lg overflow-hidden border ${viewMode === 'list' ? 'hidden lg:block' : ''}`}>
                  <LocationMap 
                    providers={aiResults.filter(r => r.latitude && r.longitude).map(r => ({
                      id: r.id || r.google_place_id || '',
                      business_name: r.business_name,
                      location: r.location,
                      latitude: r.latitude!,
                      longitude: r.longitude!,
                      google_rating: r.google_rating,
                      external_website: r.external_website
                    }))}
                    isSearching={isLoadingResults}
                    onMarkerClick={(provider) => {
                      // Find the full AI result data to show in modal
                      const fullResult = aiResults.find(
                        r => (r.id || r.google_place_id) === provider.id
                      );
                      if (fullResult) {
                        handleAIResultClick(fullResult);
                      }
                    }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </section>
        )}


        {/* My Circle / Coordination Teaser - Always visible when no search results */}
        {!showAIResults && (
          <CoordinationTeaser />
        )}

        {/* Categories Section - Only show when no AI results */}
        {!showAIResults && (
          <section className="py-16 bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Discover Activities</h2>
                <p className="text-lg text-muted-foreground">
                  Browse by category, see what parents at your school are doing, and find something fun
                </p>
              </div>
              <CategoryTiles onCategoryClick={handleCategoryClick} />
            </div>
          </section>
        )}

        {/* FunFund - Giving Back Section */}
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
                <div className="px-6 py-3 rounded-lg bg-background border">
                  <p className="text-2xl font-bold text-primary">$0</p>
                  <p className="text-sm text-muted-foreground">Raised so far</p>
                </div>
                <div className="px-6 py-3 rounded-lg bg-background border">
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

        {/* Safety & Privacy Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Your Safety Is Our Priority</h2>
              <p className="text-lg text-gray-600 mb-10">
                We take the safety of your entire family seriously. Every provider is verified, 
                and we're committed to being the most secure and privacy-focused platform for families.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="bg-camps-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-camps-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Verified Providers</h3>
                  <p className="text-gray-600">
                    All providers undergo background checks and credential verification.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="bg-camps-secondary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-6 w-6 text-camps-secondary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Privacy First</h3>
                  <p className="text-gray-600">
                    Your data is encrypted and never shared. You control who sees your information.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="bg-camps-accent/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-camps-accent" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Trusted Network</h3>
                  <p className="text-gray-600">
                    Connect only with verified parents from your school or neighborhood.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
      {/* AI Result Modal */}
      <AIResultModal
        result={selectedAIResult}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Index;
