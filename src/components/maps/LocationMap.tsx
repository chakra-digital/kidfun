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
    external_website?: string;
  }>;
  center?: { lat: number; lng: number };
  onMarkerClick?: (provider: { id: string; business_name: string; location: string }) => void;
  className?: string;
  isSearching?: boolean; // Whether the search results are currently loading
}

// Add Google Maps types
declare global {
  interface Window {
    google: any;
    __gm_init?: () => void;
  }
}

const LocationMap: React.FC<LocationMapProps> = ({ providers = [], center, onMarkerClick, className = "", isSearching = false }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const initialized = useRef(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [apiKeySubmitted, setApiKeySubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const infoWindowsRef = useRef<any[]>([]);

  console.log('LocationMap render:', { 
    providersCount: providers.length, 
    apiKeySubmitted, 
    hasError: !!error,
    className 
  });

  const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('loadGoogleMapsScript called with key:', apiKey ? 'API key provided' : 'No API key');

      const waitForMapConstructor = (onReady: () => void, onFail: (e: any) => void) => {
        const start = Date.now();
        const maxWait = 10000; // 10s safety timeout
        const tick = () => {
          if (window.google?.maps?.Map && typeof window.google.maps.Map === 'function') {
            onReady();
            return;
          }
          if (Date.now() - start > maxWait) {
            onFail(new Error('Google Maps API not ready after timeout'));
            return;
          }
          setTimeout(tick, 50);
        };
        tick();
      };
      
      // Already loaded and ready
      if (window.google?.maps?.Map && typeof window.google.maps.Map === 'function') {
        console.log('Google Maps already loaded and ready');
        resolve();
        return;
      }

      // If a script tag already exists, just wait for readiness
      const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existing) {
        console.log('Google Maps script tag already present, waiting for readiness');
        waitForMapConstructor(resolve, reject);
        return;
      }

      // Define a global callback to fire when API is fully initialized
      (window as any).__gm_init = () => {
        console.log('Google Maps global callback fired');
        waitForMapConstructor(resolve, reject);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=quarterly&callback=__gm_init`;
      script.async = true;
      script.defer = true;
      script.onerror = (error) => {
        console.error('Google Maps script onerror event:', error);
        reject(new Error('Failed to load Google Maps API - check your API key and referrer restrictions'));
      };
      
      console.log('Adding Google Maps script to document head');
      document.head.appendChild(script);

      // Absolute fallback in case callback never fires
      setTimeout(() => {
        if (!(window.google?.maps?.Map)) {
          reject(new Error('Google Maps failed to become ready (timeout)'));
        }
      }, 12000);
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
      // Use classic constructors for maximum compatibility
      const MapCtor = (window as any).google.maps.Map;

      // Calculate center from providers or use provided center or default to Austin
      let mapCenter = center || { lat: 30.2672, lng: -97.7431 };
      
      if (!center && providers.length > 0) {
        const validProviders = providers.filter(p => p.latitude && p.longitude);
        if (validProviders.length > 0) {
          const avgLat = validProviders.reduce((sum, p) => sum + (p.latitude || 0), 0) / validProviders.length;
          const avgLng = validProviders.reduce((sum, p) => sum + (p.longitude || 0), 0) / validProviders.length;
          mapCenter = { lat: avgLat, lng: avgLng };
        }
      }

      // Initialize map
      map.current = new (window as any).google.maps.Map(mapContainer.current, {
        center: mapCenter,
        zoom: 11,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'on' }] }
        ],
        // Minimize Google branding and controls
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: (window as any).google.maps.ControlPosition.RIGHT_CENTER
        }
      });

      console.log('Map initialized, adding markers...');
      // Add markers for providers
      providers.forEach((provider) => {
        // Mock coordinates around Austin area since we don't have lat/lng yet
        const lat = 30.2672 + (Math.random() - 0.5) * 0.2;
        const lng = -97.7431 + (Math.random() - 0.5) * 0.2;

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
            <div style="padding: 12px; max-width: 280px; font-family: Arial, sans-serif;">
              <h3 style="font-weight: 600; font-size: 16px; margin: 0 0 8px 0; color: #1f2937;">${provider.business_name}</h3>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">${provider.location}</p>
              ${provider.google_rating ? `
                <div style="display: flex; align-items: center; font-size: 14px; margin: 0 0 12px 0;">
                  <span style="color: #f59e0b;">★</span>
                  <span style="margin-left: 4px; color: #374151;">${provider.google_rating}</span>
                </div>
              ` : '<div style="margin-bottom: 12px;"></div>'}
              <button 
                id="view-details-init-${provider.id}"
                style="display: block; width: 100%; background-color: #3b82f6; color: white; text-align: center; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; border: none; cursor: pointer; transition: background-color 0.2s;"
                onmouseover="this.style.backgroundColor='#2563eb'" 
                onmouseout="this.style.backgroundColor='#3b82f6'">
                View Details
              </button>
            </div>
          `
        });
        
        // Store reference to info window
        infoWindowsRef.current.push(infoWindow);
        
        marker.addListener('click', () => {
          // Close all other info windows
          infoWindowsRef.current.forEach((iw) => {
            if (iw !== infoWindow) {
              iw.close();
            }
          });
          
          infoWindow.open(map.current, marker);
          
          // Wait for InfoWindow to render, then attach click handler
          setTimeout(() => {
            const button = document.getElementById(`view-details-init-${provider.id}`);
            if (button && onMarkerClick) {
              button.addEventListener('click', () => {
                infoWindow.close(); // Close popup when opening modal
                onMarkerClick({
                  id: provider.id,
                  business_name: provider.business_name,
                  location: provider.location
                });
              });
            }
          }, 100);
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
      // Close all info windows on cleanup
      infoWindowsRef.current.forEach(iw => iw.close());
      infoWindowsRef.current = [];
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

  // Add markers when providers change and map is ready
  useEffect(() => {
    if (!map.current || !providers.length) return;
    
    console.log('Adding markers for providers:', providers.length);
    providers.forEach((provider) => {
      // Use real coordinates if available, otherwise use Austin area with slight random offset
      const lat = provider.latitude || (30.2672 + (Math.random() - 0.5) * 0.1);
      const lng = provider.longitude || (-97.7431 + (Math.random() - 0.5) * 0.1);

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
          <div style="padding: 12px; max-width: 280px; font-family: Arial, sans-serif;">
            <h3 style="font-weight: 600; font-size: 16px; margin: 0 0 8px 0; color: #1f2937;">${provider.business_name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">${provider.location}</p>
            ${provider.google_rating ? `
              <div style="display: flex; align-items: center; font-size: 14px; margin: 0 0 12px 0;">
                <span style="color: #f59e0b;">★</span>
                <span style="margin-left: 4px; color: #374151;">${provider.google_rating}</span>
              </div>
            ` : '<div style="margin-bottom: 12px;"></div>'}
            <button 
              id="view-details-${provider.id}"
              style="display: block; width: 100%; background-color: #3b82f6; color: white; text-align: center; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; border: none; cursor: pointer; transition: background-color 0.2s;"
              onmouseover="this.style.backgroundColor='#2563eb'" 
              onmouseout="this.style.backgroundColor='#3b82f6'">
              View Details
            </button>
          </div>
        `
      });
      
      // Store reference to info window
      infoWindowsRef.current.push(infoWindow);
      
      marker.addListener('click', () => {
        // Close all other info windows
        infoWindowsRef.current.forEach((iw) => {
          if (iw !== infoWindow) {
            iw.close();
          }
        });
        
        infoWindow.open(map.current, marker);
        
        // Wait for InfoWindow to render, then attach click handler
        setTimeout(() => {
          const button = document.getElementById(`view-details-${provider.id}`);
          if (button && onMarkerClick) {
            button.addEventListener('click', () => {
              infoWindow.close(); // Close popup when opening modal
              onMarkerClick({
                id: provider.id,
                business_name: provider.business_name,
                location: provider.location
              });
            });
          }
        }, 100);
      });
    });
  }, [providers, map.current]);

  return (
    <div className={`relative ${className}`}>
      {(isSearching || isLoading || !map.current || providers.length === 0) && (
        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center z-10">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="animate-bounce" aria-hidden>🏃‍♀️</span>
              <span>
                {isSearching
                  ? 'Searching for providers...'
                  : isLoading
                  ? 'Loading map...'
                  : !map.current
                  ? 'Preparing map...'
                  : 'No providers to display on map'}
              </span>
            </div>
          </div>
        </div>
      )}
      {error && providers.length > 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950 dark:via-teal-950 dark:to-blue-950 rounded-lg flex items-center justify-center z-20 backdrop-blur-sm">
          <div className="text-center p-8 max-w-md">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <span className="text-3xl">📍</span>
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {providers.length} provider{providers.length !== 1 ? 's' : ''} found nearby
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Map temporarily unavailable, but your results are ready below
            </p>
            <Button onClick={handleResetApiKey} variant="outline" size="sm">
              Retry Map
            </Button>
          </div>
        </div>
      )}
      {error && providers.length === 0 && (
        <div className="absolute top-4 left-4 right-4 bg-destructive/95 text-destructive-foreground p-4 rounded-lg text-sm z-20 backdrop-blur-sm border border-destructive/20">
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <p className="font-semibold mb-1">Map temporarily unavailable</p>
                <p className="text-xs leading-relaxed opacity-90">{error}</p>
              </div>
              <Button onClick={handleResetApiKey} variant="outline" size="sm" className="text-xs shrink-0">
                Reset Key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Underlying container (covered by overlays when loading/error) */}
      <div ref={mapContainer} className="w-full h-full rounded-lg bg-muted" />
    </div>
  );
};

export default LocationMap;