import React, { useEffect, useRef, useState } from 'react';
// Lazy-load Mapbox only when needed to prevent blank-screen issues in some environments
// We'll dynamically import both the library and its CSS after the user provides a token
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

const LocationMap: React.FC<LocationMapProps> = ({ providers = [], className = "" }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSubmitted, setTokenSubmitted] = useState(false);

  const initializeMap = async (token: string) => {
    if (!mapContainer.current || !token) return;

    const mapboxgl = (await import('mapbox-gl')).default;
    await import('mapbox-gl/dist/mapbox-gl.css');

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-97.7431, 30.2672], // Austin, TX coordinates
      zoom: 11,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for providers (mock locations for now)
    providers.forEach(() => {
      // Mock coordinates around Austin area
      const lat = 30.2672 + (Math.random() - 0.5) * 0.2;
      const lng = -97.7431 + (Math.random() - 0.5) * 0.2;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-2">
          <h3 class="font-semibold">Provider</h3>
          <p class="text-sm text-gray-600">Austin area</p>
        </div>`
      );

      new mapboxgl.Marker({ color: '#3490dc' })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setTokenSubmitted(true);
      initializeMap(mapboxToken.trim());
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!tokenSubmitted) {
    return (
      <div className={`bg-muted rounded-lg p-8 flex flex-col items-center justify-center ${className}`}>
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
          To display provider locations on the map, please enter your Mapbox public token.
          Get yours at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
        </p>
        <div className="flex gap-2 w-full max-w-sm">
          <Input
            placeholder="Enter Mapbox public token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            type="password"
          />
          <Button onClick={handleTokenSubmit}>
            Load Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default LocationMap;