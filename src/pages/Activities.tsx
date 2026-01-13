import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, Map, Grid3X3, ArrowLeft } from "lucide-react";
import ConversationalSearch, { ConversationalSearchRef } from "@/components/search/ConversationalSearch";
import AIResultCard from "@/components/search/AIResultCard";
import AIResultModal from "@/components/search/AIResultModal";
import LocationMap from "@/components/maps/LocationMap";
import CategoryTiles from "@/components/home/CategoryTiles";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Activities = () => {
  const location = useLocation();
  const searchRef = useRef<ConversationalSearchRef>(null);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedAIResult, setSelectedAIResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle incoming search query or results from homepage navigation
  useEffect(() => {
    const state = location.state as { searchQuery?: string; searchResults?: any[] } | null;
    
    if (state?.searchResults && state.searchResults.length > 0) {
      // Results passed from homepage search
      setAiResults(state.searchResults);
      setShowResults(true);
      setIsSearching(false);
      // Clear the state
      window.history.replaceState({}, document.title);
    } else if (state?.searchQuery && searchRef.current) {
      // Query passed to trigger search here
      searchRef.current.triggerSearch(state.searchQuery);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAIResultsUpdate = (results: any[]) => {
    setAiResults(results);
    // Show results section once we have results (even loading skeletons)
    setShowResults(true);
    // Check if these are skeleton/loading results
    const isLoading = results.length > 0 && results[0]?.isLoading;
    setIsSearching(isLoading);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setShowResults(true);
  };

  const handleClearResults = () => {
    setAiResults([]);
    setShowResults(false);
    setIsSearching(false);
  };

  const handleAIResultClick = (result: any) => {
    setSelectedAIResult(result);
    setIsModalOpen(true);
  };

  const handleCategoryClick = (query: string) => {
    if (searchRef.current) {
      searchRef.current.triggerSearch(query);
    }
  };

  const handleMarkerClick = (provider: { id: string; business_name: string }) => {
    const result = aiResults.find(r => r.id === provider.id || r.business_name === provider.business_name);
    if (result) {
      handleAIResultClick(result);
    }
  };

  // Get valid providers with coordinates for the map
  const mappableResults = aiResults.filter(r => 
    r.latitude && r.longitude && !r.isLoading
  );

  const totalResults = aiResults.filter(r => !r.isLoading).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow pb-20 md:pb-0">
        {/* Search Header */}
        <section className="sticky top-0 z-40 bg-gradient-to-b from-primary/5 to-background border-b backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            {/* Back button when results showing */}
            {showResults && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearResults}
                className="mb-4 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Search
              </Button>
            )}
            
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Discover Activities</h1>
              <p className="text-muted-foreground">
                Find classes, camps, and enrichment programs near you
              </p>
            </div>
            
            {/* Search Component */}
            <div className="max-w-3xl mx-auto">
              <ConversationalSearch 
                ref={searchRef}
                onResultsUpdate={handleAIResultsUpdate}
                onSearchStart={handleSearchStart}
                className=""
              />
            </div>
          </div>
        </section>

        {/* Results Section */}
        {showResults ? (
          <section className="flex-1">
            {/* Results Header */}
            <div className="border-b bg-muted/30">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSearching ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    ) : (
                      <>
                        <h2 className="font-semibold">Search Results</h2>
                        <Badge variant="secondary">{totalResults} found</Badge>
                      </>
                    )}
                  </div>
                  
                  {/* View Mode Toggle - Desktop only */}
                  <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === 'split' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('split')}
                      className="h-8"
                    >
                      Split
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8"
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('map')}
                      className="h-8"
                    >
                      <Map className="h-4 w-4 mr-1" />
                      Map
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Split View Container */}
            <div className={cn(
              "flex-1",
              viewMode === 'split' && "md:flex md:h-[calc(100vh-280px)]"
            )}>
              {/* Results List */}
              <div className={cn(
                "overflow-y-auto",
                viewMode === 'map' && "hidden",
                viewMode === 'split' && "md:w-1/2 md:border-r",
                viewMode === 'list' && "w-full"
              )}>
                <div className="container mx-auto px-4 py-6 md:container-none md:px-4">
                  {totalResults === 0 && !isSearching ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No results found. Try a different search.
                      </p>
                    </div>
                  ) : (
                    <div className={cn(
                      "grid gap-4",
                      viewMode === 'list' ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                    )}>
                      {aiResults.map((result, index) => (
                        <AIResultCard
                          key={result.id || result.google_place_id || index}
                          {...result}
                          onClick={() => handleAIResultClick(result)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Map View */}
              <div className={cn(
                "bg-muted/20",
                viewMode === 'list' && "hidden",
                viewMode === 'map' && "h-[calc(100vh-280px)]",
                viewMode === 'split' && "hidden md:block md:w-1/2 md:h-full"
              )}>
                <LocationMap
                  providers={mappableResults}
                  onMarkerClick={handleMarkerClick}
                  isSearching={isSearching}
                  className="h-full w-full"
                />
              </div>
            </div>

            {/* Mobile Map Toggle */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 md:hidden">
              <Button
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className="rounded-full shadow-lg"
              >
                {viewMode === 'map' ? (
                  <>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Show List
                  </>
                ) : (
                  <>
                    <Map className="h-4 w-4 mr-2" />
                    Show Map
                  </>
                )}
              </Button>
            </div>
          </section>
        ) : (
          /* Browse Categories - When no search active */
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold mb-2">Browse by Category</h2>
                <p className="text-muted-foreground">
                  Explore popular activity categories
                </p>
              </div>
              <CategoryTiles onCategoryClick={handleCategoryClick} />
            </div>
          </section>
        )}
      </main>

      <Footer />
      <BottomNav />

      {/* AI Result Modal */}
      <AIResultModal
        result={selectedAIResult}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Activities;
