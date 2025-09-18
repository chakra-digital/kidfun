
import React from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Star, User, Calendar, MapPin, Check, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CampCard from "@/components/camps/CampCard";
import { usePublicProviderProfiles } from "@/hooks/useProviderProfiles";
import { generateProviderIcon } from "@/lib/imageUtils";

// Mock provider data
const mockProvider = {
  id: "provider1",
  name: "Ashley Thompson",
  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
  title: "Certified Camp Leader & Environmental Educator",
  location: "Boulder, Colorado",
  joinedDate: "May 2020",
  verified: true,
  certified: true,
  yearsOfExperience: 8,
  responseRate: 98,
  responseTime: "within 2 hours",
  totalReviews: 128,
  averageRating: 4.9,
  languages: ["English", "Spanish"],
  credentials: [
    "Bachelor's in Environmental Education",
    "Wilderness First Responder Certified",
    "CPR & First Aid Certified",
    "Child Safety Trained"
  ],
  bio: "I've dedicated my career to connecting children with nature and providing them with enriching outdoor experiences. With over 8 years of experience leading summer camps and outdoor programs, I'm passionate about fostering a love for the environment and helping kids develop important life skills through adventure and exploration. Every camp I lead focuses on safety, fun, and meaningful learning opportunities.",
  camps: [
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
      age: "8-12"
    },
    {
      id: "camp4",
      title: "Junior Naturalist Program",
      image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      location: "Boulder, Colorado",
      price: 65,
      priceUnit: "day",
      rating: 4.8,
      reviewCount: 87,
      dates: "Jul 15 - Jul 29",
      availability: "Available",
      type: "camp" as const,
      age: "6-9"
    },
    {
      id: "activity4",
      title: "Weekend Trail Adventures",
      image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      location: "Various locations, Colorado",
      price: 40,
      priceUnit: "session",
      rating: 4.7,
      reviewCount: 42,
      dates: "Saturdays, Year-round",
      availability: "7 spots left",
      type: "activity" as const,
      age: "7-14"
    }
  ],
  reviews: [
    {
      id: "review1",
      author: "Jennifer M.",
      date: "August 2023",
      rating: 5,
      comment: "My son had the most incredible experience at Ashley's Wilderness Adventure Camp. She created a nurturing environment where he felt comfortable trying new things. He came home everyday excited about what he learned and the friends he made. The safety protocols were excellent, and communication was clear throughout. Highly recommend!",
      userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    },
    {
      id: "review2",
      author: "Michael T.",
      date: "July 2023",
      rating: 5,
      comment: "Ashley's Junior Naturalist Program was perfect for my daughter. She has a great way with kids and makes learning about nature fun and engaging. The activities were well-planned and age-appropriate. My daughter can't wait to go back next summer!",
      userImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    },
    {
      id: "review3",
      author: "Sarah K.",
      date: "June 2023",
      rating: 4,
      comment: "The Weekend Trail Adventures were a hit with my kids! Ashley is knowledgeable and enthusiastic about nature. The only reason for 4 stars instead of 5 is that some hikes were a bit challenging for my younger child, but Ashley was accommodating and made sure everyone had a good time.",
      userImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    }
  ]
};

const ProviderProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { profiles: providers } = usePublicProviderProfiles();
  
  // Find the provider by ID, fallback to mock data if not found
  const provider = providers.find(p => p.id === id);
  
  // If provider not found, show error message
  if (!provider && providers.length > 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Provider Not Found</h1>
            <p className="text-gray-600 mb-4">The requested provider profile could not be found.</p>
            <Link to="/camps">
              <Button>Browse All Providers</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Use actual provider data or mock as fallback
  const displayProvider = provider || mockProvider;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Provider Info */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <img 
                    src={provider?.external_website ? generateProviderIcon(provider.business_name, provider.specialties, provider.id) : mockProvider.image} 
                    alt={provider?.business_name || mockProvider.name}
                    className="w-full h-full object-cover rounded-full border-4 border-white shadow-sm"
                  />
                  {(provider?.verification_status === 'verified' || mockProvider.verified) && (
                    <div className="absolute -bottom-2 -right-2 bg-camps-certified text-white rounded-full p-1.5">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h1 className="text-3xl font-bold">{provider?.business_name || mockProvider.name}</h1>
                    <Badge className="bg-camps-certified max-w-fit">
                      {provider?.verification_status === 'verified' ? 'Verified Provider' : 'Listed Provider'}
                    </Badge>
                  </div>
                  <p className="text-xl text-gray-700 mt-1">{provider?.description || mockProvider.title}</p>
                  <div className="flex items-center mt-2 text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{provider?.location || mockProvider.location}</span>
                    {!provider && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Joined {mockProvider.joinedDate}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Star className="h-5 w-5 fill-current text-camps-accent mr-1" />
                    <span className="font-semibold text-lg">{provider?.google_rating || mockProvider.averageRating}</span>
                  </div>
                  <p className="text-gray-600">{provider?.google_reviews_count || mockProvider.totalReviews} reviews</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <User className="h-5 w-5 mr-1" />
                    <span className="font-semibold text-lg">{provider?.years_experience || mockProvider.yearsOfExperience}+ years</span>
                  </div>
                  <p className="text-gray-600">Experience</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <MessageSquare className="h-5 w-5 mr-1" />
                    <span className="font-semibold text-lg">{mockProvider.responseRate}%</span>
                  </div>
                  <p className="text-gray-600">Response rate</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Clock className="h-5 w-5 mr-1" />
                    <span className="font-semibold text-lg">2 hrs</span>
                  </div>
                  <p className="text-gray-600">Response time</p>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">About {provider?.business_name || mockProvider.name}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {provider?.description || mockProvider.bio}
                </p>
              </div>

              {/* Languages & Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-medium mb-3">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {(provider?.specialties || mockProvider.languages).map((item, index) => (
                      <Badge key={index} variant="outline" className="text-gray-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Amenities</h3>
                  <ul className="space-y-2">
                    {(provider?.amenities || mockProvider.credentials).map((item, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-camps-certified mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* External Website Link */}
              {provider?.external_website && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Visit Website</h2>
                  <Button 
                    onClick={() => window.open(`${provider.external_website}?utm_source=kidfun&utm_medium=profile&utm_campaign=provider_referral`, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Visit {provider.business_name}'s Website
                  </Button>
                </div>
              )}

              {/* Mock camps only shown for demo provider */}
              {!provider && (
                <>
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{mockProvider.name}'s Camps & Activities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {mockProvider.camps.map((camp) => (
                        <CampCard key={camp.id} {...camp} />
                      ))}
                    </div>
                  </div>

                  {/* Reviews */}
                  <div>
                    <div className="flex items-center mb-4">
                      <Star className="h-5 w-5 fill-current text-camps-accent mr-1" />
                      <h2 className="text-xl font-semibold">
                        {mockProvider.averageRating} · {mockProvider.totalReviews} reviews
                      </h2>
                    </div>
                    <div className="space-y-6">
                      {mockProvider.reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6">
                          <div className="flex items-center mb-3">
                            <img 
                              src={review.userImage} 
                              alt={review.author}
                              className="w-10 h-10 object-cover rounded-full mr-3"
                            />
                            <div>
                              <p className="font-medium">{review.author}</p>
                              <p className="text-gray-500 text-sm">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'fill-current text-camps-accent' : 'text-gray-300'} mr-0.5`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="mt-6">
                      Show all {mockProvider.totalReviews} reviews
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Contact */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Contact {provider?.business_name || mockProvider.name}</h2>
                <p className="text-gray-600 mb-6">
                  Have questions? Reach out to discuss your child's needs or learn more about activities.
                </p>
                
                {provider?.external_website ? (
                  <Button 
                    className="w-full mb-3"
                    onClick={() => window.open(`${provider.external_website}?utm_source=kidfun&utm_medium=profile_contact&utm_campaign=provider_referral`, '_blank')}
                  >
                    Visit Website
                  </Button>
                ) : (
                  <Button className="w-full mb-3">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                )}
                
                {provider?.phone && (
                  <Button variant="outline" className="w-full mb-3">
                    Call {provider.phone}
                  </Button>
                )}
                
                <p className="text-xs text-center text-gray-500">
                  {provider ? 'Contact information available on their website' : `${mockProvider.name} typically responds within 2 hours`}
                </p>
                
                {/* Safety Reminder */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Check className="h-5 w-5 text-camps-certified mr-2" />
                    Safety Reminder
                  </h3>
                  <p className="text-sm text-gray-600">
                    All hosts on CampFinder undergo background checks and credential verification. Always communicate through our platform for added security.
                  </p>
                </div>

                {/* Report Button */}
                <div className="mt-6 text-center">
                  <Button variant="link" size="sm" className="text-gray-500">
                    Report this profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProviderProfile;
