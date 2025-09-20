import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ExternalLink, Sparkles, Phone } from 'lucide-react';

interface AIResultCardProps {
  id?: string;
  google_place_id?: string;
  business_name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  google_rating?: number;
  google_reviews_count?: number;
  description?: string;
  specialties?: string[];
  phone?: string;
  external_website?: string;
  relevanceScore: number;
  explanation: string;
  isNewDiscovery: boolean;
  source: string;
  onClick?: () => void;
}

const AIResultCard: React.FC<AIResultCardProps> = ({
  business_name,
  location,
  google_rating,
  google_reviews_count,
  description,
  specialties,
  phone,
  external_website,
  relevanceScore,
  explanation,
  isNewDiscovery,
  onClick
}) => {
  const formatLocation = (location: string) => {
    // Truncate long addresses for display
    return location.length > 60 ? location.substring(0, 60) + '...' : location;
  };

  return (
    <Card className={`h-full cursor-pointer transition-all duration-200 hover:shadow-lg ${
      isNewDiscovery ? 'border-l-4 border-l-primary' : ''
    }`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight mb-1">
                {business_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{formatLocation(location)}</span>
              </div>
            </div>
            {isNewDiscovery && (
              <Badge variant="default" className="ml-2 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
          </div>

          {/* Rating */}
          {google_rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{google_rating.toFixed(1)}</span>
              </div>
              {google_reviews_count && (
                <span className="text-sm text-muted-foreground">
                  ({google_reviews_count} reviews)
                </span>
              )}
              <div className="ml-auto">
                <Badge variant="outline" className="text-xs">
                  {relevanceScore}% match
                </Badge>
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          {/* AI Explanation */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <div className="text-xs text-primary font-medium mb-1">Why this matches:</div>
            <p className="text-xs text-muted-foreground">{explanation}</p>
          </div>

          {/* Specialties */}
          {specialties && specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{specialties.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {phone && (
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${phone}`, '_self');
            }}
          >
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
        )}
        {external_website && (
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              window.open(external_website, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Website
          </Button>
        )}
        <Button 
          size="sm" 
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIResultCard;