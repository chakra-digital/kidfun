import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ExternalLink, Sparkles, Phone, Navigation } from 'lucide-react';
import LocationMap from '@/components/maps/LocationMap';
import { useIsMobile } from '@/hooks/use-mobile';

export interface AIResult {
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
  const isMobile = useIsMobile();
  
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

  const content = (
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
          <p className="text-muted-foreground leading-relaxed">{result.description}</p>
        </div>
      )}

      {/* Match Explanation */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
        <p className="text-muted-foreground">{result.explanation}</p>
      </div>

      {/* Specialties */}
      {result.specialties && result.specialties.length > 0 && (
        <div>
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
            center={{ lat: result.latitude, lng: result.longitude }}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-4 border-t">
        <Button 
          className="w-full"
          size="lg"
          onClick={() => {
            if (result.external_website) {
              // Provider has a website - use it with UTM tracking
              try {
                const url = new URL(result.external_website);
                url.searchParams.append('utm_source', 'kidfun');
                url.searchParams.append('utm_medium', 'ai_search');
                url.searchParams.append('utm_campaign', 'provider_discovery');
                window.open(url.toString(), '_blank', 'noopener,noreferrer');
              } catch {
                window.open(result.external_website, '_blank', 'noopener,noreferrer');
              }
            } else if (result.google_place_id) {
              // No website but has Google Place ID - link to Google Maps business page
              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.business_name)}&query_place_id=${result.google_place_id}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            } else {
              // Fallback: Google search for the business
              const searchQuery = encodeURIComponent(`${result.business_name} ${result.location}`);
              window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {result.external_website ? 'Visit Website' : 'View on Google Maps'}
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-3">
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
        </div>
      </div>
    </div>
  );

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-left">
              {result.business_name}
              {result.isNewDiscovery && (
                <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

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
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default AIResultModal;