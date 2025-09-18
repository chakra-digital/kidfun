import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CampCard from "@/components/camps/CampCard";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Loader2 } from "lucide-react";
import { usePublicProviderProfiles } from "@/hooks/useProviderProfiles";
import { Badge } from "@/components/ui/badge";
import { generateProviderIcon } from "@/lib/imageUtils";
import { useLocation } from "react-router-dom";

const Camps = () => {
  const [activeFilter, setActiveFilter] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { profiles: providers, loading, error } = usePublicProviderProfiles();

  // Read search query from URL params and update when it changes
  const location = useLocation();
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    setSearchQuery(search || '');
  }, [location.search]);

  // Filter providers based on search query
  const filteredProviders = providers.filter((provider) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      provider.business_name.toLowerCase().includes(query) ||
      provider.location.toLowerCase().includes(query) ||
      provider.description?.toLowerCase().includes(query) ||
      provider.specialties?.some(specialty => specialty.toLowerCase().includes(query)) ||
      provider.age_groups?.some(age => age.toLowerCase().includes(query))
    );
  });

  // Transform provider profiles to camp card format
  const transformedProviders = filteredProviders.map(provider => ({
    id: provider.id,
    title: provider.business_name,
    image: generateProviderIcon(provider.business_name, provider.specialties, provider.id),
    location: provider.location,
    price: provider.base_price || 50,
    priceUnit: "day" as const,
    rating: provider.google_rating || 4.5,
    reviewCount: provider.google_reviews_count || 0,
    dates: "Available",
    availability: "Contact for availability",
    type: "camp" as const,
    distance: "Austin area",
    age: provider.age_groups?.join(", ") || "All ages",
    external_website: provider.external_website
  }));

  const allResults = transformedProviders;
  const totalResults = allResults.length;

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter === activeFilter ? "" : filter);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Loading camps and activities...</p>
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
            <p className="text-red-600 mb-4">Error loading camps: {error}</p>
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
        <section className="bg-gradient-to-r from-camps-primary to-camps-secondary text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Summer Camps & Activities</h1>
              <p className="text-xl mb-8">Discover amazing camps and activities for your kids</p>
              
              {searchQuery && (
                <div className="mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {totalResults} results for "{searchQuery}"
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {totalResults === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">
                  {searchQuery ? `No results found for "${searchQuery}"` : "No camps found."}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      window.history.pushState({}, '', '/camps');
                    }}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allResults.map((result) => (
                    <div key={result.id} className="relative">
                      <div 
                        className="cursor-pointer"
                        onClick={() => window.location.href = `/provider/${result.id}`}
                      >
                        <CampCard {...result} />
                      </div>
                      {'external_website' in result && result.external_website && (
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`${result.external_website}?utm_source=kidfun&utm_medium=camps_page&utm_campaign=provider_referral`, '_blank');
                            }}
                          >
                            Visit Website
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-10 text-center">
                  <p className="text-gray-600 mb-4">
                    Showing {totalResults} results
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Camp Planning Guide */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Summer Camp Planning Guide</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Not sure which camp is right for your child? Our comprehensive guide helps you choose the perfect camp based on your child's interests, age, and your schedule.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-camps-primary/10 p-2 rounded-full mr-4 mt-1">
                      <Calendar className="h-5 w-5 text-camps-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Select the Right Timing</h3>
                      <p className="text-gray-600">Find camps that fit your summer schedule, from day camps to multi-week residential programs.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-camps-secondary/10 p-2 rounded-full mr-4 mt-1">
                      <MapPin className="h-5 w-5 text-camps-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Choose the Right Location</h3>
                      <p className="text-gray-600">Consider proximity to home, transportation options, and the camp environment that best suits your child.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-camps-accent/10 p-2 rounded-full mr-4 mt-1">
                      <User className="h-5 w-5 text-camps-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Match Your Child's Interests</h3>
                      <p className="text-gray-600">From sports and arts to science and outdoor adventures, find camps that align with your child's passions.</p>
                    </div>
                  </div>
                </div>
                <Button className="mt-6" size="lg">
                  Download Planning Guide
                </Button>
              </div>
              <div className="relative h-64 lg:h-80">
                <img 
                  src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" 
                  alt="Kids enjoying summer camp activities"
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Camp Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Camp Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sports & Recreation</h3>
                <p className="text-gray-600">Soccer, basketball, swimming, and more active adventures for energetic kids.</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-400 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Arts & Creativity</h3>
                <p className="text-gray-600">Painting, music, theater, and crafts to nurture your child's creative spirit.</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">STEM & Technology</h3>
                <p className="text-gray-600">Coding, robotics, science experiments, and innovative learning experiences.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Camps;