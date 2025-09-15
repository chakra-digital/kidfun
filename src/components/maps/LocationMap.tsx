import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  providers?: Array<{
    id: string;
    business_name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    google_rating?: number;
  }>;
  className?: string;
}

// Add Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

const LocationMap: React.FC<LocationMapProps> = ({ providers = [], className = "" }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [apiKeySubmitted, setApiKeySubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });
  };

  const initializeMap = async (apiKey: string) => {
    if (!mapContainer.current || !apiKey) return;

    setIsLoading(true);
    
    try {
      await loadGoogleMapsScript(apiKey);

      // Initialize map centered on Austin, TX
      map.current = new window.google.maps.Map(mapContainer.current, {
        center: { lat: 30.2672, lng: -97.7431 },
        zoom: 11,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // Add markers for providers
      providers.forEach((provider) => {
        // For now, use mock coordinates around Austin area since we don't have lat/lng
        const lat = 30.2672 + (Math.random() - 0.5) * 0.2;
        const lng = -97.7431 + (Math.random() - 0.5) * 0.2;

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map.current,
          title: provider.business_name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#1e40af',
            strokeWeight: 2,
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2 max-w-xs">
              <h3 class="font-semibold text-sm">${provider.business_name}</h3>
              <p class="text-xs text-gray-600 mb-1">${provider.location}</p>
              ${provider.google_rating ? `
                <div class="flex items-center text-xs">
                  <span class="text-yellow-500">★</span>
                  <span class="ml-1">${provider.google_rating}</span>
                </div>
              ` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map.current, marker);
        });
      });

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = () => {
    if (googleMapsApiKey.trim()) {
      setApiKeySubmitted(true);
      initializeMap(googleMapsApiKey.trim());
    }
  };

  useEffect(() => {
    return () => {
      // Google Maps cleanup is handled automatically
    };
  }, []);

  if (!apiKeySubmitted) {
    return (
      <div className={`bg-muted rounded-lg p-8 flex flex-col items-center justify-center ${className}`}>
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
          To display provider locations on the map, please enter your Google Maps API key.
          Get yours at <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a>
        </p>
        <div className="flex gap-2 w-full max-w-sm">
          <Input
            placeholder="Enter Google Maps API key"
            value={googleMapsApiKey}
            onChange={(e) => setGoogleMapsApiKey(e.target.value)}
            type="password"
          />
          <Button onClick={handleApiKeySubmit} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load Map'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default LocationMap;