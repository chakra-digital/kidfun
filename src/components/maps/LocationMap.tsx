import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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
  const initialized = useRef(false);
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script onload event triggered');
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
      // Feature-detect the loader API; fall back to classic constructors if not available
      let MapCtor: any;
      let AdvancedMarkerElement: any | null = null;
      let PinElement: any | null = null;

      if ((window as any).google.maps.importLibrary) {
        const { Map } = await (window as any).google.maps.importLibrary('maps');
        const markerLib = await (window as any).google.maps.importLibrary('marker');
        MapCtor = Map;
        AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
        PinElement = markerLib.PinElement;
      } else {
        MapCtor = (window as any).google.maps.Map;
        AdvancedMarkerElement = (window as any).google.maps?.marker?.AdvancedMarkerElement || null;
        PinElement = (window as any).google.maps?.marker?.PinElement || null;
      }

      // Initialize map centered on Austin, TX
      map.current = new MapCtor(mapContainer.current, {
        center: { lat: 30.2672, lng: -97.7431 },
        zoom: 11,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'on' }] }
        ]
      });

      console.log('Map initialized, adding markers...');
      // Add markers for providers using AdvancedMarkerElement when available, else fall back
      providers.forEach((provider) => {
        // Mock coordinates around Austin area since we don't have lat/lng yet
        const lat = 30.2672 + (Math.random() - 0.5) * 0.2;
        const lng = -97.7431 + (Math.random() - 0.5) * 0.2;

        if (PinElement && AdvancedMarkerElement) {
          const pinElement = new PinElement({
            background: '#3b82f6',
            borderColor: '#1e40af',
            glyphColor: '#ffffff',
          });
          const marker = new AdvancedMarkerElement({
            position: { lat, lng },
            map: map.current,
            title: provider.business_name,
            content: pinElement.element,
          });
          const infoWindow = new (window as any).google.maps.InfoWindow({
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
          marker.addListener('click', () => infoWindow.open(map.current, marker));
        } else {
          const marker = new (window as any).google.maps.Marker({
            position: { lat, lng },
            map: map.current,
            title: provider.business_name,
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#1e40af',
              strokeWeight: 2,
            }
          });
          const infoWindow = new (window as any).google.maps.InfoWindow({
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
          marker.addListener('click', () => infoWindow.open(map.current, marker));
        }
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


  const handleResetApiKey = () => {
    localStorage.removeItem('googleMapsApiKey');
    setApiKeySubmitted(false);
    setGoogleMapsApiKey('');
    setError('');
    initialized.current = false;
    if (map.current) {
      map.current = null;
    }
  };
  // Fetch API key on mount (from localStorage or Edge Function) and auto-submit
  useEffect(() => {
    const init = async () => {
      const savedApiKey = localStorage.getItem('googleMapsApiKey');
      if (savedApiKey) {
        setGoogleMapsApiKey(savedApiKey);
        setApiKeySubmitted(true);
        return;
      }
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        if (error) throw error;
        const key = (data as any)?.key;
        if (!key) throw new Error('No API key returned');
        localStorage.setItem('googleMapsApiKey', key);
        setGoogleMapsApiKey(key);
        setApiKeySubmitted(true);
      } catch (e: any) {
        console.error('Failed to fetch Maps API key', e);
        setError(e.message || 'Unable to load Google Maps API key');
      } finally {
        setIsLoading(false);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    return () => {
      // Google Maps cleanup is handled automatically
    };
  }, []);

  // Initialize map after the container is mounted and key is available
  useEffect(() => {
    if (!apiKeySubmitted) return;

    const key = (googleMapsApiKey || localStorage.getItem('googleMapsApiKey') || '').trim();

    if (!mapContainer.current) {
      console.log('Map container not ready yet');
      return;
    }
    if (!key) {
      console.warn('No API key available to initialize map');
      return;
    }
    if (initialized.current) {
      console.log('Map already initialized, skipping');
      return;
    }

    initialized.current = true;
    console.log('Initializing map from effect...');
    void initializeMap(key);
  }, [apiKeySubmitted, googleMapsApiKey]);

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
      <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white p-2 rounded flex items-center gap-2">
        <span>Status: {isLoading ? 'Loading...' : error ? 'Error' : 'Ready'} | Providers: {providers.length}</span>
        <Button 
          onClick={handleResetApiKey} 
          variant="outline" 
          size="sm" 
          className="text-xs py-1 px-2 h-auto"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default LocationMap;