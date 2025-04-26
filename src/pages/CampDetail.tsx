
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Calendar, Check, MapPin, Share, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockCampDetails = {
  id: "camp1",
  title: "Wilderness Adventure Camp",
  description: "A week-long summer camp with nature hikes, outdoor survival skills, and exciting crafts. Children will learn about ecology, wildlife, and environmental conservation while having fun in the great outdoors.",
  images: [
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
  ],
  location: "Boulder, Colorado",
  fullAddress: "5678 Mountain View Rd, Boulder, CO 80301",
  price: 80,
  priceUnit: "day",
  totalPrice: 560, // for a week
  rating: 4.9,
  reviewCount: 128,
  dates: [
    { id: "date1", range: "Jun 10 - Jun 16", price: 80, availability: "3 spots left" },
    { id: "date2", range: "Jun 17 - Jun 23", price: 80, availability: "7 spots left" },
    { id: "date3", range: "Jul 8 - Jul 14", price: 85, availability: "12 spots left" },
  ],
  ageRange: "8-12 years",
  groupSize: "Max 15 children per group",
  offerings: [
    "Daily nature hikes",
    "Wildlife identification",
    "Outdoor survival skills",
    "Environmental education",
    "Campfire cooking",
    "Team-building activities",
    "Arts and crafts with natural materials",
    "First aid basics",
  ],
  provider: {
    id: "provider1",
    name: "Ashley Thompson",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    verified: true,
    certified: true,
    yearsOfExperience: 8,
    responseRate: 98,
    responseTime: "within 2 hours",
  },
  safetyMeasures: [
    "CPR and First Aid certified staff",
    "6:1 child to counselor ratio",
    "Daily health checks",
    "Emergency action plans",
    "All staff background checked",
  ],
};

const CampDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDateId, setSelectedDateId] = useState(mockCampDetails.dates[0].id);
  
  // Find the selected date details
  const selectedDate = mockCampDetails.dates.find(date => date.id === selectedDateId);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Image Gallery */}
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">{mockCampDetails.title}</h1>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Star className="h-5 w-5 fill-current text-camps-accent mr-1" />
              <span className="font-medium mr-1">{mockCampDetails.rating}</span>
              <span className="text-gray-500">({mockCampDetails.reviewCount} reviews) • </span>
              <span className="ml-1 text-gray-700">{mockCampDetails.location}</span>
            </div>
            <Button variant="ghost" size="sm" className="flex items-center">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="rounded-lg overflow-hidden h-72">
              <img 
                src={mockCampDetails.images[0]} 
                alt={mockCampDetails.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {mockCampDetails.images.slice(1, 3).map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden h-[140px]">
                  <img 
                    src={image} 
                    alt={`${mockCampDetails.title} ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              <div className="rounded-lg overflow-hidden h-[140px] relative bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button variant="outline">View All Photos</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2">
              {/* Host info */}
              <div className="flex justify-between items-center pb-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    Camp hosted by {mockCampDetails.provider.name}
                  </h2>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-4">{mockCampDetails.ageRange}</span>
                    <span className="text-gray-600">{mockCampDetails.groupSize}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="relative w-14 h-14">
                    <img 
                      src={mockCampDetails.provider.image} 
                      alt={mockCampDetails.provider.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                    {mockCampDetails.provider.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-camps-certified text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="py-6 border-b">
                <p className="text-gray-700 leading-relaxed mb-4">
                  {mockCampDetails.description}
                </p>
                <Button variant="link" className="p-0 h-auto text-camps-primary">Read more</Button>
              </div>

              {/* What's Offered */}
              <div className="py-6 border-b">
                <h2 className="text-xl font-semibold mb-4">What's Offered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3">
                  {mockCampDetails.offerings.slice(0, 6).map((offering, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 mr-3 text-camps-secondary" />
                      <span>{offering}</span>
                    </div>
                  ))}
                </div>
                {mockCampDetails.offerings.length > 6 && (
                  <Button variant="outline" className="mt-4">
                    Show all {mockCampDetails.offerings.length} offerings
                  </Button>
                )}
              </div>

              {/* Safety Measures */}
              <div className="py-6 border-b">
                <h2 className="text-xl font-semibold mb-4">Safety Measures</h2>
                <div className="space-y-3">
                  {mockCampDetails.safetyMeasures.map((measure, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 mr-3 text-camps-secondary" />
                      <span>{measure}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="py-6 border-b">
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <span>{mockCampDetails.fullAddress}</span>
                </div>
                <div className="bg-gray-200 h-64 rounded-lg relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button>View Map</Button>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              <div className="py-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={mockCampDetails.provider.image} 
                    alt={mockCampDetails.provider.name}
                    className="w-14 h-14 object-cover rounded-full mr-4"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">
                      {mockCampDetails.provider.name}
                      {mockCampDetails.provider.verified && (
                        <Badge className="ml-2 bg-camps-certified">Verified</Badge>
                      )}
                    </h2>
                    <p className="text-gray-600">
                      Joined 3 years ago • {mockCampDetails.provider.yearsOfExperience} years of experience
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-current text-camps-accent mr-1" />
                    <span className="font-medium">{mockCampDetails.rating} Rating</span>
                  </div>
                  <div>
                    <span>{mockCampDetails.provider.responseRate}% response rate</span>
                  </div>
                  <div>
                    <span>Responds {mockCampDetails.provider.responseTime}</span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">
                  Passionate about fostering creativity in kids through outdoor adventures. Certified wilderness guide with a background in childhood education.
                </p>
                
                <Button variant="outline" className="mr-3">
                  Contact Host
                </Button>
                <Link to={`/provider/${mockCampDetails.provider.id}`}>
                  <Button variant="link" className="p-0 h-auto text-camps-primary">
                    View Host Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Booking */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-2xl font-semibold">${selectedDate?.price}</span>
                    <span className="text-gray-600">/{mockCampDetails.priceUnit}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-current text-camps-accent mr-1" />
                    <span>{mockCampDetails.rating}</span>
                    <span className="text-gray-500 text-sm ml-1">({mockCampDetails.reviewCount})</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">Select session dates:</h3>
                  <div className="space-y-2">
                    {mockCampDetails.dates.map((date) => (
                      <div 
                        key={date.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedDateId === date.id ? 'border-camps-primary bg-camps-primary/5' : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDateId(date.id)}
                      >
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{date.range}</span>
                          </div>
                          <Badge variant={date.availability.includes("spots") ? "default" : "outline"} className={date.availability.includes("spots") ? "bg-camps-primary" : "text-camps-secondary border-camps-secondary"}>
                            {date.availability}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-b py-4 my-4 space-y-2">
                  <div className="flex justify-between">
                    <span>${selectedDate?.price} x 7 days</span>
                    <span>${selectedDate ? selectedDate.price * 7 : mockCampDetails.totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>$35</span>
                  </div>
                </div>

                <div className="flex justify-between font-bold pt-4 mb-6">
                  <span>Total</span>
                  <span>${selectedDate ? selectedDate.price * 7 + 35 : mockCampDetails.totalPrice + 35}</span>
                </div>

                <Button className="w-full mb-4">Reserve</Button>
                <p className="text-center text-sm text-gray-500">
                  You won't be charged yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CampDetail;
