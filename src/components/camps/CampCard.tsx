
import React from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviderImage } from "@/hooks/useProviderImage";

export interface CampCardProps {
  id: string;
  title: string;
  image: string;
  location: string;
  price: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  dates: string;
  availability: string;
  type: "camp" | "activity";
  distance?: string;
  age?: string;
  external_website?: string;
  specialties?: string[];
  description?: string;
  image_url?: string | null;
}

const CampCard = ({
  id,
  title,
  image,
  location,
  price,
  priceUnit,
  rating,
  reviewCount,
  dates,
  availability,
  type,
  distance,
  age,
  external_website,
  specialties,
  description,
  image_url,
}: CampCardProps) => {
  
  const { imageUrl: generatedImage, loading: imageLoading, error: imageError } = useProviderImage({
    providerId: id,
    businessName: title,
    specialties,
    description,
    existingImageUrl: image_url,
    location,
  });

  // Fall back to placeholder if generation fails or is unavailable
  const displayImage = generatedImage || image;
  
  // Handle click - navigate to provider's website if available, otherwise to provider page
  const handleClick = (e: React.MouseEvent) => {
    if (external_website) {
      e.preventDefault();
      // Add UTM tracking parameters
      const url = new URL(external_website);
      url.searchParams.append('utm_source', 'kidfun');
      url.searchParams.append('utm_medium', 'featured');
      url.searchParams.append('utm_campaign', 'provider_card');
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    }
    // If no external website, let the Link component handle navigation to provider page
  };
  return (
    <Link to={`/provider/${id}`} className="block" onClick={handleClick}>
      <div className="rounded-xl overflow-hidden shadow-sm border card-hover">
        {/* Card Image - Show loading skeleton, image, or nothing if generation failed */}
        {imageLoading && !imageError ? (
          <div className="relative aspect-[4/3]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : displayImage ? (
          <div className="relative aspect-[4/3]">
            <img
              src={displayImage}
              alt={title}
              className="w-full h-full object-cover"
            />
            {age && (
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-white/90 text-camps-dark shadow-sm">
                  Ages {age}
                </Badge>
              </div>
            )}
            {availability.includes("spots") && (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-camps-primary text-white shadow-sm">
                  {availability}
                </Badge>
              </div>
            )}
          </div>
        ) : null}

        {/* Card Content */}
        <div className={displayImage ? "p-3" : "p-4"}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
              {distance && <span className="opacity-70">· {distance}</span>}
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-current text-camps-accent mr-1" />
              <span className="font-medium">{rating}</span>
              <span className="text-gray-500 text-sm ml-1">({reviewCount})</span>
            </div>
          </div>

          <h3 className="font-medium text-base mb-1 text-camps-dark line-clamp-2">{title}</h3>

          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{dates}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-camps-dark">${price}</span>
              <span className="text-gray-600">/{priceUnit}</span>
            </div>
            {availability && !availability.includes("spots") && (
              <Badge variant="outline" className="text-camps-secondary border-camps-secondary">
                {availability}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CampCard;
