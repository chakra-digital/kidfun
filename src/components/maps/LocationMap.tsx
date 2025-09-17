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
  const [error, setError] = useState<string>('');

  console.log('LocationMap render:', { 
    providersCount: providers.length, 
    apiKeySubmitted, 
    hasError: !!error,
    className 
  });

  const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('loadGoogleMapsScript called with key:', apiKey ? 'API key provided' : 'No API key');
      
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script onload event triggered');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Google Maps script onerror event:', error);
        reject(new Error('Failed to load Google Maps API - check your API key and referrer restrictions'));
      };
      
      console.log('Adding Google Maps script to document head');
      document.head.appendChild(script);
    });
  };

  const initializeMap = async (apiKey: string) => {
    if (!mapContainer.current || !apiKey) return;

    setIsLoading(true);
    setError('');
    
    try {
      console.log('Loading Google Maps with API key...');
      await loadGoogleMapsScript(apiKey);
      console.log('Google Maps script loaded successfully');

      // Test if Google Maps is available
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API not available after loading');
      }

      console.log('Initializing map...');
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

      console.log('Map initialized, adding markers...');
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
      console.log('Markers added successfully');

    } catch (error: any) {
      console.error('Error loading Google Maps:', error);
      setError(error.message || 'Failed to load Google Maps. Please check your API key and try again.');
      setApiKeySubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = () => {
    console.log('handleApiKeySubmit called with key:', googleMapsApiKey ? 'API key provided' : 'No API key');
    if (googleMapsApiKey.trim()) {
      // Save to localStorage
      localStorage.setItem('googleMapsApiKey', googleMapsApiKey.trim());
      setApiKeySubmitted(true);
      console.log('About to call initializeMap');
      initializeMap(googleMapsApiKey.trim());
    } else {
      console.log('No API key provided, not submitting');
    }
  };

  const handleResetApiKey = () => {
    localStorage.removeItem('googleMapsApiKey');
    setApiKeySubmitted(false);
    setGoogleMapsApiKey('');
    setError('');
    if (map.current) {
      map.current = null;
    }
  };

  // Check for saved API key on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('googleMapsApiKey');
    if (savedApiKey) {
      setGoogleMapsApiKey(savedApiKey);
      setApiKeySubmitted(true);
      initializeMap(savedApiKey);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Google Maps cleanup is handled automatically
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {!apiKeySubmitted ? (
        // API Key Input Form
        <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center h-full">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            To display provider locations on the map, please enter your Google Maps API key.
            Get yours at <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a>
          </p>
          <p className="text-xs text-muted-foreground text-center mb-4 max-w-md">
            For referrer restrictions, add these exact formats:
            <br />• <code className="bg-background px-1 rounded">*.lovable.dev/*</code>
            <br />• <code className="bg-background px-1 rounded">https://kidfun.app/*</code>
            <br />• <code className="bg-background px-1 rounded">https://www.kidfun.app/*</code>
            <br />• <code className="bg-background px-1 rounded">http://localhost:*</code>
          </p>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm max-w-md text-center">
              {error}
            </div>
          )}
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
      ) : (
        // Map Container
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-destructive/90 text-destructive-foreground p-3 rounded-md text-sm z-20">
              <div className="flex justify-between items-start gap-2">
                <span>{error}</span>
                <Button onClick={handleResetApiKey} variant="outline" size="sm" className="text-xs">
                  Reset Key
                </Button>
              </div>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full rounded-lg bg-muted" style={{ minHeight: '400px' }} />
          
          {/* Debug info */}
          <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white p-2 rounded">
            Status: {isLoading ? 'Loading...' : error ? 'Error' : 'Ready'} | Providers: {providers.length}
          </div>
        </>
      )}
    </div>
  );
};

export default LocationMap;