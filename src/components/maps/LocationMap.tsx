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
  const errorSetRef = useRef(false); // Prevent error re-renders
  const infoWindowsRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const [currentBallEmoji, setCurrentBallEmoji] = useState('⚽');
  
  // Animated sports balls for loading state
  useEffect(() => {
    const balls = ['🏀', '🎾', '⚽', '🏐', '⚾'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % balls.length;
      setCurrentBallEmoji(balls[index]);
    }, 400);
    return () => clearInterval(interval);
  }, []);
  
  // Reset error when providers change (new search results)
  useEffect(() => {
    if (providers.length > 0 && errorSetRef.current) {
      console.log('Resetting error state for new provider results');
      errorSetRef.current = false;
      setError('');
    }
  }, [providers]);
  
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
        console.error('Google Maps script load failed:', error);
        console.error('Current hostname:', window.location.hostname);
        console.error('Verify that your Google Maps API key allows requests from this domain');
        reject(new Error(`Failed to load Google Maps - verify API key allows ${window.location.hostname}`));
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
  const initializeMap = React.useCallback(async (apiKey: string) => {
    if (!mapContainer.current || !apiKey || initialized.current) return;

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

      // Start with a default center - markers will adjust the view
      const mapCenter = center || { lat: 30.2672, lng: -97.7431 };
      const mapZoom = 11;

      // Initialize map with error handling and natural earthy styling
      map.current = new (window as any).google.maps.Map(mapContainer.current, {
        center: mapCenter,
        zoom: mapZoom,
        styles: [
          // Softer, more natural colors for landscape
          { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b3e5fc' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
          // Muted green for parks/natural areas
          { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c8e6c9' }] },
          // Hide all POI labels and icons for cleaner map (only show our result markers)
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'simplified' }] }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: (window as any).google.maps.ControlPosition.RIGHT_CENTER
        }
      });

      // Mark map as initialized only after successful creation
      initialized.current = true;

      // Listen for map errors with delayed check to avoid false positives
      try {
        const container = mapContainer.current;
        if (container) {
          // Wait a moment before checking for errors to let map initialize
          setTimeout(() => {
            const errEl = container.querySelector('.gm-err-message, .gm-err-container');
            if (errEl && !errorSetRef.current) {
              const errorText = errEl.textContent || 'Unknown error';
              console.error('=== GOOGLE MAPS ERROR DETECTED ===');
              console.error('Error text:', errorText);
              console.error('Current hostname:', window.location.hostname);
              console.error('Error element HTML:', errEl.innerHTML);
              console.error('================================');
              errorSetRef.current = true;
              setError(`Map Error: ${errorText}. Verify API key allows ${window.location.hostname}`);
            }
          }, 1500);

          // Observe DOM mutations to catch async error overlays (once only)
          const observer = new MutationObserver(() => {
            const errEl = container.querySelector('.gm-err-message, .gm-err-container');
            if (errEl && !errorSetRef.current) {
              const errorText = errEl.textContent || 'Configuration issue';
              console.error('Google Maps error overlay detected:', errorText);
              errorSetRef.current = true;
              setError(`Map error: ${errorText.substring(0, 100)}`);
              observer.disconnect(); // Stop observing after first error
            }
          });
          observer.observe(container, { childList: true, subtree: true });

          // Check on tiles loaded
          (window as any).google.maps.event.addListenerOnce(map.current, 'tilesloaded', () => {
            console.log('Google Maps tiles loaded successfully');
            const errorDiv = container.querySelector('.gm-err-message, .gm-err-container');
            if (errorDiv && !errorSetRef.current) {
              const errorText = errorDiv.textContent || 'Failed to load tiles';
              console.error('Google Maps error after tiles loaded:', errorText);
              errorSetRef.current = true;
              setError(`Map error: ${errorText.substring(0, 100)}`);
            } else {
              console.log('Map loaded without errors');
            }
          });
        }
      } catch (e) {
        console.warn('Map error detection setup failed:', e);
      }


      // Markers will be managed in the providers effect when results change
      console.log('Map initialized. Waiting for providers to render markers...');

    } catch (error: any) {
      console.error('Error loading Google Maps:', error);
      setError(error.message || 'Failed to load Google Maps');
      // Keep apiKeySubmitted true so we show fallback instead of loading
    } finally {
      setIsLoading(false);
    }
  }, [center]);


  const handleResetApiKey = async () => {
    localStorage.removeItem('googleMapsApiKey');
    setApiKeySubmitted(false);
    setGoogleMapsApiKey('');
    setError('');
    errorSetRef.current = false; // Reset error flag
    initialized.current = false;
    if (map.current) {
      map.current = null;
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
      await initializeMap(key);
    } catch (e: any) {
      console.error('Failed to fetch Maps API key on retry', e);
      setError(e.message || 'Unable to load Google Maps API key');
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch API key on mount (from localStorage or Edge Function) and auto-submit
  useEffect(() => {
    const init = async () => {
      const savedApiKey = localStorage.getItem('googleMapsApiKey');
      if (savedApiKey) {
        console.log('Found saved API key, setting state...');
        setGoogleMapsApiKey(savedApiKey);
        setApiKeySubmitted(true);
        return;
      }
        try {
          setIsLoading(true);
          console.log('Fetching Maps API key...');
          const { data, error } = await supabase.functions.invoke('get-maps-key');
          if (error) throw error;
          const key = (data as any)?.key;
          if (!key) throw new Error('No API key returned');
          console.log('API key fetched successfully');
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
    if (!apiKeySubmitted || initialized.current) return;

    const key = (googleMapsApiKey || localStorage.getItem('googleMapsApiKey') || '').trim();

    if (!mapContainer.current) {
      console.log('Map container not ready yet');
      return;
    }
    if (!key) {
      console.warn('No API key available to initialize map');
      return;
    }

    console.log('Initializing map from effect...');
    void initializeMap(key);
  }, [apiKeySubmitted, initializeMap, googleMapsApiKey]);

  // Add markers when providers change and map is ready
  useEffect(() => {
    if (!map.current) return;

    // Clear prior UI
    infoWindowsRef.current.forEach(iw => iw.close());
    infoWindowsRef.current = [];
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (!providers || providers.length === 0) return;

    const validProviders = providers.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
    if (validProviders.length === 0) return;

    console.log('Rendering markers for providers:', validProviders.length);

    const bounds = new (window as any).google.maps.LatLngBounds();

    validProviders.forEach((provider) => {
      const position = { lat: provider.latitude as number, lng: provider.longitude as number };

      const marker = new (window as any).google.maps.Marker({
        position,
        map: map.current,
        title: provider.business_name,
        // Use default red pin for better visibility
        icon: validProviders.length === 1 ? null : {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });
      markersRef.current.push(marker);
      bounds.extend(position);

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
      infoWindowsRef.current.push(infoWindow);

      marker.addListener('click', () => {
        // Close all other info windows
        infoWindowsRef.current.forEach((iw) => {
          if (iw !== infoWindow) iw.close();
        });
        infoWindow.open(map.current, marker);
        setTimeout(() => {
          const button = document.getElementById(`view-details-${provider.id}`);
          if (button && onMarkerClick) {
            button.addEventListener('click', () => {
              infoWindow.close();
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

    // Fit map to new markers with proper padding
    if (validProviders.length === 1) {
      // Single marker - just center on it with reasonable zoom (closer for detail view)
      map.current.setCenter(validProviders[0].latitude && validProviders[0].longitude 
        ? { lat: validProviders[0].latitude, lng: validProviders[0].longitude }
        : bounds.getCenter()
      );
      map.current.setZoom(15);
    } else {
      // Multiple markers - fit to bounds
      map.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      
      // Limit max zoom after fitting
      (window as any).google.maps.event.addListenerOnce(map.current, 'idle', () => {
        const z = map.current.getZoom();
        if (z > 14) map.current.setZoom(14);
      });
    }
  }, [providers]);

  return (
    <div className={`relative ${className}`}>
      {/* Loading states - show when searching, loading, or map not ready */}
      {(isSearching || isLoading || !map.current) && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center z-40">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">
              {currentBallEmoji}
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
              {isSearching 
                ? 'Searching providers...' 
                : isLoading 
                ? 'Loading map...' 
                : 'Preparing map...'}
            </p>
            {providers.length > 0 && !isSearching && (
              <p className="text-sm text-muted-foreground">
                Found {providers.length} location{providers.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Show "No providers" message when search is done but no results */}
      {!isSearching && !isLoading && map.current && providers.length === 0 && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center z-40">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              No providers to display
            </p>
          </div>
        </div>
      )}
      {/* Beautiful earthy gradient fallback when error with results */}
      {error && providers.length > 0 && !isSearching && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-green-50 to-emerald-100 dark:from-amber-900/30 dark:via-green-900/30 dark:to-emerald-900/30 rounded-lg flex items-center justify-center z-30">
          <div className="text-center p-8 max-w-md">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 backdrop-blur-sm">
              <span className="text-4xl">🗺️</span>
            </div>
            <p className="text-xl font-bold text-foreground mb-2">
              {providers.length} provider{providers.length !== 1 ? 's' : ''} found nearby
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Map view temporarily unavailable—scroll down to see your results
            </p>
            <Button onClick={handleResetApiKey} variant="outline" size="sm" className="backdrop-blur-sm">
              Retry Map
            </Button>
          </div>
        </div>
      )}
      {/* Error without results */}
      {error && providers.length === 0 && !isSearching && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg flex items-center justify-center z-20">
          <div className="text-center p-8 max-w-md">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">Map unavailable</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleResetApiKey} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Map container - visible when initialized */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg bg-muted" 
        style={{ 
          display: error ? 'none' : 'block'
        }}
      />
    </div>
  );
};

export default LocationMap;