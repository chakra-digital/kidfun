import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CampCard from "@/components/camps/CampCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePublicProviderProfiles } from "@/hooks/useProviderProfiles";
import ConversationalSearch from "@/components/search/ConversationalSearch";
import AIResultCard from "@/components/search/AIResultCard";
import AIResultModal from "@/components/search/AIResultModal";
import { Badge } from "@/components/ui/badge";
import { generateProviderIcon } from "@/lib/imageUtils";


const Activities = () => {
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [showAIResults, setShowAIResults] = useState(false);
  const { profiles: providers, loading, error } = usePublicProviderProfiles();

  const handleAIResultsUpdate = (results: any[]) => {
    setAiResults(results);
    setShowAIResults(results.length > 0);
  };

  const handleClearAIResults = () => {
    setAiResults([]);
    setShowAIResults(false);
  };

  const [selectedAIResult, setSelectedAIResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAIResultClick = (result: any) => {
    setSelectedAIResult(result);
    setIsModalOpen(true);
  };

  // Transform provider profiles to activity card format
  const transformedProviders = !showAIResults ? providers.map(provider => ({
    id: provider.id,
    title: provider.business_name,
    image: generateProviderIcon(provider.business_name, provider.specialties, provider.id),
    location: provider.location,
    price: provider.base_price || 25,
    priceUnit: "session" as const,
    rating: provider.google_rating || 4.5,
    reviewCount: provider.google_reviews_count || 0,
    dates: "Ongoing",
    availability: "Contact for schedule",
    type: "activity" as const,
    distance: "Austin area",
    age: provider.age_groups?.join(", ") || "All ages",
    external_website: provider.external_website
  })) : [];

  const allResults = showAIResults ? aiResults : transformedProviders;
  const totalResults = allResults.length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Loading activities...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading activities: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Header */}
        <section className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Activities & Classes</h1>
              <p className="text-xl mb-8">Find enriching activities and ongoing classes for your kids</p>
            </div>
            
            {/* AI Conversational Search */}
            <div className="mb-8">
              <ConversationalSearch 
                onResultsUpdate={handleAIResultsUpdate}
                className=""
              />
            </div>

            {showAIResults && (
              <div className="text-center mt-4">
                <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white/30">
                  {totalResults} results from AI search
                </Badge>
              </div>
            )}
          </div>
        </section>
        
        {/* AI Results Header */}
        {showAIResults && aiResults.length > 0 && (
          <div className="border-b bg-primary/5">
            <div className="container mx-auto py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">AI-Powered Search Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {aiResults.length} relevant providers ranked by AI relevance
                  </p>
                </div>
                <Button variant="outline" onClick={handleClearAIResults}>
                  Back to Browse All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {totalResults === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">
                  {showAIResults ? "No AI results found. Try a different search." : "No activities found."}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (showAIResults) {
                      handleClearAIResults();
                    }
                  }}
                >
                  {showAIResults ? "Back to Browse All" : "Refresh"}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">
                    {showAIResults ? "AI Search Results" : "All Activities"}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {totalResults} {totalResults === 1 ? 'result' : 'results'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {showAIResults ? (
                    // Render AI Results
                    allResults.map((result, index) => (
                      <AIResultCard
                        key={result.id || result.google_place_id || index}
                        {...result}
                        onClick={() => handleAIResultClick(result)}
                      />
                    ))
                  ) : (
                    // Render Traditional Activity Cards
                    allResults.map((result) => (
                      <div key={result.id} className="relative">
                        <div 
                          className="cursor-pointer"
                          onClick={() => window.location.href = `/provider/${result.id}`}
                        >
                          <CampCard {...result} />
                        </div>
                        {result.external_website && (
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`${result.external_website}?utm_source=kidfun&utm_medium=activities_page&utm_campaign=provider_referral`, '_blank');
                              }}
                            >
                              Visit Website
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
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

export default Activities;
