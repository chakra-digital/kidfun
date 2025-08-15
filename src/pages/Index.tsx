import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterBar from "@/components/filters/FilterBar";
import CampCard from "@/components/camps/CampCard";
import { Button } from "@/components/ui/button";
import { MapPin, User, Calendar, Star } from "lucide-react";
import heroImage from "@/assets/kids-soccer-hero.jpg";

// Mock data for camps and activities
const mockCamps = [
  {
    id: "camp1",
    title: "Wilderness Adventure Camp",
    image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Boulder, Colorado",
    price: 80,
    priceUnit: "day",
    rating: 4.9,
    reviewCount: 128,
    dates: "Jun 10 - Jun 24",
    availability: "3 spots left",
    type: "camp" as const,
    distance: "15 miles away",
    age: "8-12"
  },
  {
    id: "camp2",
    title: "Tech Innovators STEM Camp",
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "San Francisco, CA",
    price: 95,
    priceUnit: "day",
    rating: 4.8,
    reviewCount: 87,
    dates: "Jul 5 - Jul 16",
    availability: "Available",
    type: "camp" as const,
    distance: "10 miles away",
    age: "10-15"
  },
  {
    id: "activity1",
    title: "Forest Ecology Exploration",
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Portland, Oregon",
    price: 45,
    priceUnit: "session",
    rating: 4.7,
    reviewCount: 64,
    dates: "Weekends in June",
    availability: "7 spots left",
    type: "activity" as const,
    age: "6-10"
  },
  {
    id: "activity2",
    title: "Creative Arts & Crafts Workshop",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Austin, TX",
    price: 35,
    priceUnit: "session",
    rating: 4.9,
    reviewCount: 112,
    dates: "Mon & Wed, June-July",
    availability: "Available",
    type: "activity" as const,
    age: "5-9"
  },
  {
    id: "camp3",
    title: "Summer Sports Academy",
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Chicago, IL",
    price: 75,
    priceUnit: "day",
    rating: 4.6,
    reviewCount: 93,
    dates: "Jun 15 - Jul 30",
    availability: "5 spots left",
    type: "camp" as const,
    distance: "8 miles away",
    age: "9-14"
  },
  {
    id: "activity3",
    title: "Nature Photography Adventure",
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Seattle, WA",
    price: 55,
    priceUnit: "session",
    rating: 4.8,
    reviewCount: 47,
    dates: "Saturdays in July",
    availability: "Available",
    type: "activity" as const,
    age: "11-16"
  },
];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter === activeFilter ? "" : filter);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section 
          className="relative text-white py-20 overflow-hidden"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Kids camps, activities, tutors, sports and more
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Find trusted providers, book with confidence, and create unforgettable experiences
              </p>
              
              {/* Category Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-gray-900 hover:bg-white/90 rounded-full px-8 py-3 font-semibold"
                >
                  Summer Camps
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 py-3 font-semibold"
                >
                  Activities
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 py-3 font-semibold"
                >
                  Tutors
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 py-3 font-semibold"
                >
                  Sports
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 py-3 font-semibold"
                >
                  After School
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <FilterBar 
          onFilterChange={handleFilterChange}
          activeFilter={activeFilter}
        />

        {/* Featured Camps and Activities */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Featured Camps & Activities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCamps.map((camp) => (
                <CampCard key={camp.id} {...camp} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" className="rounded-full">
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
