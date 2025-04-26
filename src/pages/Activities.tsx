
import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterBar from "@/components/filters/FilterBar";
import CampCard from "@/components/camps/CampCard";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Calendar, List, User } from "lucide-react";

// Mock data for activities
const mockActivities = [
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
  {
    id: "activity4",
    title: "Junior Soccer League",
    image: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Chicago, IL",
    price: 40,
    priceUnit: "session",
    rating: 4.6,
    reviewCount: 83,
    dates: "Tuesdays & Thursdays, June-Aug",
    availability: "5 spots left",
    type: "activity" as const,
    age: "7-12"
  },
  {
    id: "activity5",
    title: "Coding for Kids",
    image: "https://images.unsplash.com/photo-1517613992687-2f8e8415f780?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "San Francisco, CA",
    price: 60,
    priceUnit: "session",
    rating: 4.9,
    reviewCount: 56,
    dates: "Mondays, June-July",
    availability: "Available",
    type: "activity" as const,
    age: "10-14"
  },
  {
    id: "activity6",
    title: "Kids Outdoor Cooking Class",
    image: "https://images.unsplash.com/photo-1526455131823-3066654ad50f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    location: "Denver, CO",
    price: 50,
    priceUnit: "session",
    rating: 4.7,
    reviewCount: 39,
    dates: "Saturdays, June-Sep",
    availability: "10 spots left",
    type: "activity" as const,
    age: "8-13"
  }
];

const activityCategories = [
  { icon: <User className="h-5 w-5" />, label: "Sports" },
  { icon: <Calendar className="h-5 w-5" />, label: "Arts & Crafts" },
  { icon: <List className="h-5 w-5" />, label: "STEM" },
  { icon: <MapPin className="h-5 w-5" />, label: "Outdoor" },
  { icon: <Plus className="h-5 w-5" />, label: "All Activities" },
];

const Activities = () => {
  const [activeFilter, setActiveFilter] = useState("");

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter === activeFilter ? "" : filter);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-camps-primary to-camps-accent text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Discover Activities Your Kids Will Love
              </h1>
              <p className="text-lg mb-6">
                From art workshops to sports leagues, find the perfect activity to engage your child's interests and talents.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <div className="border-b sticky top-16 bg-white z-40">
          <div className="container mx-auto py-4">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2 hide-scrollbar">
              {activityCategories.map((category) => (
                <Button
                  key={category.label}
                  variant={activeFilter === category.label ? "default" : "outline"}
                  size="sm"
                  className="rounded-full whitespace-nowrap"
                  onClick={() => handleFilterChange(category.label)}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full whitespace-nowrap ml-auto"
              >
                <span className="mr-2">Filters</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Activities Grid */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Popular Activities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockActivities.map((activity) => (
                <CampCard key={activity.id} {...activity} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" className="rounded-full">
                Load More Activities
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Our Activities?</h2>
              <p className="text-lg text-gray-600">
                Our activities are designed to engage, educate, and inspire children while ensuring their safety and enjoyment.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="bg-camps-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-camps-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Expert Instructors</h3>
                <p className="text-gray-600 text-center">
                  All activities are led by verified professionals with experience teaching children.
                </p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="bg-camps-accent/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-camps-accent" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Flexible Scheduling</h3>
                <p className="text-gray-600 text-center">
                  Find one-time workshops, weekly sessions, or ongoing programs that fit your schedule.
                </p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="bg-camps-secondary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-camps-secondary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Quality Experiences</h3>
                <p className="text-gray-600 text-center">
                  Activities are rated by parents to ensure consistent quality and positive experiences.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Activities;
