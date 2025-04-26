import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterBar from "@/components/filters/FilterBar";
import CampCard from "@/components/camps/CampCard";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User } from "lucide-react";

// Mock data for camps
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
    id: "camp4",
    title: "Young Artists Workshop",
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "New York, NY",
    price: 85,
    priceUnit: "day",
    rating: 4.7,
    reviewCount: 76,
    dates: "Jul 10 - Aug 7",
    availability: "Available",
    type: "camp" as const,
    distance: "5 miles away",
    age: "7-13"
  },
  {
    id: "camp5",
    title: "Junior Explorers Nature Camp",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Portland, OR",
    price: 70,
    priceUnit: "day",
    rating: 4.9,
    reviewCount: 104,
    dates: "Jun 20 - Jul 15",
    availability: "2 spots left",
    type: "camp" as const,
    distance: "12 miles away",
    age: "6-10"
  },
  {
    id: "camp6",
    title: "Ocean Adventure Camp",
    image: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "San Diego, CA",
    price: 90,
    priceUnit: "day",
    rating: 4.8,
    reviewCount: 89,
    dates: "Jul 5 - Jul 26",
    availability: "Available",
    type: "camp" as const,
    distance: "7 miles away",
    age: "8-13"
  }
];

const Camps = () => {
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
        <section className="bg-gradient-to-r from-camps-secondary to-camps-primary text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Find the Perfect Summer Camp
              </h1>
              <p className="text-lg mb-6">
                Discover camps that provide enriching experiences, new friendships, and unforgettable memories.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="relative w-full sm:w-auto">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Where are you looking?"
                    className="pl-10 pr-4 py-3 rounded-full w-full sm:w-64 text-camps-dark"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <Button size="lg" className="rounded-full w-full sm:w-auto">
                  Find Camps
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

        {/* Camps Grid */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Popular Summer Camps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCamps.map((camp) => (
                <CampCard key={camp.id} {...camp} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" className="rounded-full">
                Load More Camps
              </Button>
            </div>
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
                      <h3 className="font-semibold text-lg">Consider the Location</h3>
                      <p className="text-gray-600">Choose from nearby day camps or destination camps for older children.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-camps-accent/10 p-2 rounded-full mr-4 mt-1">
                      <User className="h-5 w-5 text-camps-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Match Interests and Skills</h3>
                      <p className="text-gray-600">Find specialized camps that cater to your child's interests, from sports to arts to STEM.</p>
                    </div>
                  </div>
                </div>
                <Button className="mt-8 rounded-full">Download Free Guide</Button>
              </div>
              <div className="hidden lg:block">
                <img 
                  src="https://images.unsplash.com/photo-1493962853295-0fd70327578a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" 
                  alt="Children at summer camp"
                  className="rounded-xl shadow-lg"
                />
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
