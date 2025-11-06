import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CampCard from "@/components/camps/CampCard";
import ConversationalSearch from "@/components/search/ConversationalSearch";
import AIResultCard from "@/components/search/AIResultCard";
import AIResultModal from "@/components/search/AIResultModal";
import LocationMap from "@/components/maps/LocationMap";
import { Button } from "@/components/ui/button";
import type { AIResult } from "@/components/search/AIResultModal";
import { User, Calendar, Star } from "lucide-react";
import { usePublicProviderProfiles } from "@/hooks/useProviderProfiles";
import heroImage from "@/assets/kids-soccer-hero-bright.jpg";
import { getProviderImage } from "@/lib/imageUtils";

// Mock data for camps

const Index = () => {
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [showAIResults, setShowAIResults] = useState(false);
  const [selectedAIResult, setSelectedAIResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profiles: providers, loading: providersLoading } = usePublicProviderProfiles();
  const navigate = useNavigate();

  const handleAIResultsUpdate = (results: any[]) => {
    console.log('AI Results received:', results);
    setAiResults(results);
    setShowAIResults(results.length > 0);
  };

  // Calculate map center from AI results
  const mapCenter = React.useMemo(() => {
    if (aiResults.length === 0) return undefined;
    
    const validResults = aiResults.filter(r => r.latitude && r.longitude);
    if (validResults.length === 0) return undefined;

    const avgLat = validResults.reduce((sum, r) => sum + r.latitude, 0) / validResults.length;
    const avgLng = validResults.reduce((sum, r) => sum + r.longitude, 0) / validResults.length;
    
    console.log('Calculated map center:', { lat: avgLat, lng: avgLng });
    return { lat: avgLat, lng: avgLng };
  }, [aiResults]);

  const handleAIResultClick = (result: any) => {
    setSelectedAIResult(result);
    setIsModalOpen(true);
  };

  // Transform provider profiles to CampCard format
  const transformedProviders = providers.map((provider) => ({
    id: provider.id,
    title: provider.business_name,
    image: '', // Remove images to avoid duplicative/irrelevant content
    location: provider.location,
    price: provider.base_price || 35,
    priceUnit: "session" as const,
    rating: provider.google_rating || 4.5,
    reviewCount: provider.google_reviews_count || 0,
    dates: "Available",
    availability: "Available",
    type: "activity" as const,
    age: "6-12", // Default age range
    distance: "Austin area",
    external_website: provider.external_website
  }));

  // Get featured providers (first 8 for better grid layout)
  const featuredProviders = transformedProviders.slice(6, 14);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section with AI Search */}
        <section 
          className="relative text-white py-16 md:py-24 overflow-hidden min-h-[70vh] flex items-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/40 via-teal-500/40 to-green-500/40"></div>
          
          <div className="container mx-auto px-4 relative z-10 w-full">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-white"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.4)'
                }}
              >
                Where childhood memories are made
              </h1>
              <p 
                className="text-lg sm:text-xl md:text-2xl text-white/95 mb-8"
                style={{
                  textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                Discover trusted camps, activities and more near you
              </p>
            </div>
            
            {/* AI Conversational Search */}
            <ConversationalSearch 
              onResultsUpdate={handleAIResultsUpdate}
              className=""
            />
          </div>
        </section>

        {/* AI Results Section with Map */}
        {showAIResults && aiResults.length > 0 && (
          <section className="py-12 bg-background">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Search Results</h2>
                  <p className="text-muted-foreground mt-1">
                    Found {aiResults.length} relevant providers
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowAIResults(false)}>
                  Clear Results
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Results Cards - Left Side */}
                <div className="space-y-4 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-2">
                  {aiResults.map((result, index) => (
                    <AIResultCard
                      key={result.id || result.google_place_id || index}
                      {...result}
                      onClick={() => handleAIResultClick(result)}
                    />
                  ))}
                </div>
                
                {/* Map - Right Side */}
                <div className="lg:sticky lg:top-24 h-[400px] lg:h-[calc(100vh-16rem)] rounded-lg overflow-hidden border">
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
                    center={mapCenter}
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


        {/* Featured Providers Section - Only show when no AI results */}
        {!showAIResults && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">Featured Providers</h2>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/camps')}
                  className="rounded-full"
                >
                  View All
                </Button>
              </div>
              {providersLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {featuredProviders.map((camp) => (
                    <CampCard key={camp.id} {...camp} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Trust Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Your Child's Safety Is Our Priority</h2>
              <p className="text-lg text-gray-600 mb-10">
                Every camp and activity provider on our platform undergoes a thorough vetting process.
                We verify credentials, check references, and ensure proper certifications.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="bg-camps-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <User className="h-6 w-6 text-camps-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Verified Providers</h3>
                  <p className="text-gray-600">
                    All providers undergo background checks and credential verification.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="bg-camps-secondary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-camps-secondary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Certified Programs</h3>
                  <p className="text-gray-600">
                    Activities and camps meet or exceed safety standards and guidelines.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="bg-camps-accent/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-camps-accent" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Parent Reviews</h3>
                  <p className="text-gray-600">
                    Real feedback from parents who've trusted our providers.
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
