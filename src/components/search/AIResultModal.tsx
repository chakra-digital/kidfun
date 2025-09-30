import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ExternalLink, Sparkles, Phone, Navigation } from 'lucide-react';
import LocationMap from '@/components/maps/LocationMap';

interface AIResult {
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
}

interface AIResultModalProps {
  result: AIResult | null;
  isOpen: boolean;
  onClose: () => void;
}

const AIResultModal: React.FC<AIResultModalProps> = ({ result, isOpen, onClose }) => {
  if (!result) return null;

  const handleGetDirections = () => {
    if (result.latitude && result.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${result.latitude},${result.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.location)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.business_name}
            {result.isNewDiscovery && (
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                New Discovery
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Location & Rating */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{result.location}</span>
            </div>
            
            {result.google_rating && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-lg">{result.google_rating.toFixed(1)}</span>
                  {result.google_reviews_count && (
                    <span className="text-muted-foreground ml-1">
                      ({result.google_reviews_count} reviews)
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-sm">
                  {result.relevanceScore}% match
                </Badge>
              </div>
            )}
          </div>

          {/* Description */}
          {result.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">{result.description}</p>
            </div>
          )}

          {/* AI Explanation */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <h3 className="font-semibold text-primary mb-2">Why this matches your search:</h3>
            <p className="text-muted-foreground">{result.explanation}</p>
          </div>

          {/* Specialties */}
          {result.specialties && result.specialties.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Activities & Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {result.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {(result.latitude && result.longitude) && (
            <div>
              <h3 className="font-semibold mb-3">Location</h3>
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <LocationMap 
                  providers={[{
                    id: result.id || result.google_place_id || '',
                    business_name: result.business_name,
                    location: result.location,
                    latitude: result.latitude,
                    longitude: result.longitude,
                    google_rating: result.google_rating,
                    external_website: result.external_website
                  }]}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleGetDirections}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            
            {result.phone && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(`tel:${result.phone}`, '_self')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call {result.phone}
              </Button>
            )}
            
            {result.external_website && (
              <Button 
                className="flex-1"
                onClick={() => window.open(result.external_website, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Website
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIResultModal;