import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterBar from "@/components/filters/FilterBar";
import CampCard from "@/components/camps/CampCard";
import LocationMap from "@/components/maps/LocationMap";
import { Button } from "@/components/ui/button";
import { MapPin, User, Calendar, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePublicProviderProfiles } from "@/hooks/useProviderProfiles";
import heroImage from "@/assets/kids-soccer-hero-bright.jpg";
import { generateProviderIcon } from "@/lib/imageUtils";

// Mock data for camps

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const { user, loading } = useAuth();
  const { profiles: providers, loading: providersLoading } = usePublicProviderProfiles();
  const navigate = useNavigate();

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter === activeFilter ? "" : filter);
  };

  // Transform provider profiles to CampCard format
  const transformedProviders = providers.map((provider) => ({
    id: provider.id,
    title: provider.business_name,
    image: generateProviderIcon(provider.business_name, provider.specialties, provider.id),
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
        {/* Hero Section */}
        <section 
          className="relative text-white py-16 md:py-24 overflow-hidden min-h-[70vh] flex items-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Stronger overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          
          <div className="container mx-auto px-4 relative z-10 w-full">
            <div className="max-w-5xl mx-auto text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight drop-shadow-lg">
                The best camps, activities and more
                </h1>
              <p className="text-lg md:text-xl mb-8 md:mb-10 text-white/95 max-w-3xl mx-auto drop-shadow-md">
                Find trusted providers, book with confidence, and create unforgettable experiences
              </p>
              
              {/* Category Buttons */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold text-sm md:text-base shadow-lg transition-all duration-200"
                  onClick={() => navigate('/camps')}
                >
                  Summer Camps
                </Button>
                <Button 
                   variant="secondary" 
                   size="lg" 
                   className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold text-sm md:text-base shadow-lg transition-all duration-200"
                   onClick={() => navigate('/activities')}
                 >
                   Activities
                 </Button>
                 <Button 
                   variant="secondary" 
                   size="lg" 
                   className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold text-sm md:text-base shadow-lg transition-all duration-200"
                   onClick={() => navigate('/camps')}
                 >
                   Tutors
                 </Button>
                 <Button 
                   variant="secondary" 
                   size="lg" 
                   className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold text-sm md:text-base shadow-lg transition-all duration-200"
                   onClick={() => navigate('/camps')}
                 >
                   Sports
                 </Button>
                 <Button 
                   variant="secondary" 
                   size="lg" 
                   className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold text-sm md:text-base shadow-lg transition-all duration-200"
                   onClick={() => navigate('/camps')}
                 >
                   After School
                 </Button>
              </div>
            </div>
          </div>
        </section>


        {/* Local Results Section with Map */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Local Providers</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Results Grid */}
              <div>
                {providersLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {transformedProviders.slice(0, 6).map((item) => (
                      <CampCard key={item.id} {...item} />
                    ))}
                  </div>
                )}
              </div>

              {/* Map Component */}
              <LocationMap 
                providers={transformedProviders.map(p => ({
                  id: p.id,
                  business_name: p.title,
                  location: p.location,
                  google_rating: p.rating,
                  external_website: p.external_website
                }))}
                className="h-[600px] lg:h-[700px]"
              />
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full"
                onClick={() => navigate('/camps')}
              >
                View All Local Providers
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Camps and Activities */}
        <section className="py-8 md:py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Featured Camps & Activities</h2>
            {providersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {featuredProviders.map((camp) => (
                  <CampCard key={camp.id} {...camp} />
                ))}
              </div>
            )}
            <div className="mt-8 md:mt-10 text-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full"
                onClick={() => navigate('/camps')}
              >
                Show More Options
              </Button>
            </div>
          </div>
        </section>

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
    </div>
  );
};

export default Index;
