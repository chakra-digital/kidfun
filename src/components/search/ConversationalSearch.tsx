import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Sparkles, MapPin, Palette, Crown, ChefHat, Music, Languages, Trees, Drama, Gamepad2, FlaskConical, GraduationCap, Users, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { LocationInput } from '@/components/ui/location-input';
import { searchCache } from '@/lib/searchCache';

// Animated emoji placeholder hook
const useAnimatedPlaceholder = (emojis: string[], baseText: string) => {
  const [currentEmoji, setCurrentEmoji] = useState(emojis[0]);
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % emojis.length;
      setCurrentEmoji(emojis[index]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [emojis]);
  
  return `${currentEmoji} ${baseText}`;
};

interface SearchResult {
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
  relevanceScore: number;
  explanation: string;
  isNewDiscovery: boolean;
  source: string;
}

interface ConversationalSearchProps {
  onResultsUpdate: (results: SearchResult[]) => void;
  onSearchStart?: () => void;
  className?: string;
  compact?: boolean;
}

const ConversationalSearch: React.FC<ConversationalSearchProps> = ({ 
  onResultsUpdate,
  onSearchStart,
  className = "",
  compact = false 
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [lastSearchAnalysis, setLastSearchAnalysis] = useState<any>(null);
  const [isWhereOpen, setIsWhereOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Animated placeholders
  const activityPlaceholder = useAnimatedPlaceholder(
    ['⚽', '🎨', '🎭', '🏊', '⛺', '🎪'],
    'What are you looking for?'
  );
  const locationPlaceholder = useAnimatedPlaceholder(
    ['📍', '🗺️', '🌍', '✈️', '🧭'],
    'Enter city, state, or ZIP code'
  );

  // Computed display value
  const whereFilter = locationInput;

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation not available:', error);
        }
      );
    }
  }, []);

  const handleSearch = async (categoryOverride?: string, locationOverride?: string) => {
    const searchQuery = query.trim();
    const searchCategory = categoryOverride || (selectedCategories.length > 0 ? selectedCategories.join(', ') : '');
    
    if (!searchQuery && !searchCategory) return;
    if (isSearching) return;
    
    // Build enhanced query with category
    let enhancedQuery = searchQuery || `Find ${searchCategory} activities`;
    
    if (searchCategory && searchQuery) {
      enhancedQuery += ` focusing on ${searchCategory}`;
    }

    // Capture current location input to avoid stale state
    const currentLocationInput = locationInput || locationOverride || '';
    
    // Determine location to use
    let searchLocation = currentLocationInput;
    
    if (!searchLocation && userLocation) {
      searchLocation = `${userLocation.lat},${userLocation.lng}`;
    }
    
    if (!searchLocation) {
      searchLocation = 'Austin, TX';
    }
    
    console.log('Search params:', { query: enhancedQuery, location: searchLocation, locationInput: currentLocationInput });

    // Check cache first
    const cached = searchCache.get(enhancedQuery, searchLocation);
    if (cached) {
      console.log('Using cached results');
      onResultsUpdate(cached.results);
      setLastSearchAnalysis(cached.searchAnalysis);
      toast({
        title: "Instant Results",
        description: `Found ${cached.results.length} providers (from cache)`,
      });
      return;
    }
    
    // Clear previous results and trigger loading state
    onResultsUpdate([]);
    setLastSearchAnalysis(null);
    onSearchStart?.();

    setIsSearching(true);
    console.log('Starting AI search...');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-provider-search', {
        body: { query: enhancedQuery, location: searchLocation }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to invoke search function');
      }

      if (!data) {
        throw new Error('No data returned from search function');
      }

      const { results, searchAnalysis, newProvidersFound } = data;
      
      // Cache the results
      searchCache.set(enhancedQuery, searchLocation, results || [], searchAnalysis, newProvidersFound);
      
      // Update results
      onResultsUpdate(results || []);
      setLastSearchAnalysis(searchAnalysis);

      // Show success message
      toast({
        title: "Search Complete",
        description: `Found ${results?.length || 0} relevant providers${
          newProvidersFound > 0 ? ` (${newProvidersFound} new discoveries!)` : ''
        }`,
      });

    } catch (error: any) {
      console.error('Search error details:', error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search providers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const categories = [
    { icon: Palette, label: 'Art', value: 'art' },
    { icon: Crown, label: 'Chess', value: 'chess' },
    { icon: ChefHat, label: 'Cooking', value: 'cooking' },
    { icon: Music, label: 'Dance', value: 'dance' },
    { icon: Users, label: 'Gymnastics', value: 'gymnastics' },
    { icon: Languages, label: 'Language', value: 'language' },
    { icon: Trees, label: 'Nature', value: 'nature' },
    { icon: Drama, label: 'Performing arts', value: 'performing-arts' },
    { icon: Gamepad2, label: 'Sports', value: 'sports' },
    { icon: FlaskConical, label: 'STEM', value: 'stem' },
    { icon: GraduationCap, label: 'Study', value: 'study' },
    { icon: Users, label: 'Mixed', value: 'mixed' },
  ];

  const toggleCategory = (categoryValue: string) => {
    // Toggle selection
    const newCategories = selectedCategories.includes(categoryValue) 
      ? selectedCategories.filter(c => c !== categoryValue)
      : [categoryValue]; // Only allow one category at a time for clearer searches
    
    setSelectedCategories(newCategories);
    // Don't auto-trigger search - let user click the search button
  };

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What are you looking for?"
            className="flex-1 rounded-full border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary"
            disabled={isSearching}
          />
          <Button 
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            size="icon"
            className="rounded-full h-12 w-12 flex-shrink-0 shadow-lg hover:scale-110 transition-all duration-200"
          >
            {isSearching ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Send className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Redesigned Stacked Search Box */}
      <div className="relative">
        <Card className="backdrop-blur-md bg-background/60 border border-border/30 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {/* Activity Input - Taller */}
            <div className="relative border-b border-border/20">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={activityPlaceholder}
                className="h-16 px-6 border-0 bg-transparent text-base placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isSearching}
              />
            </div>
            
            {/* Location Input - Standard height */}
            <div className="relative">
              <LocationInput
                value={locationInput}
                onChange={(value) => setLocationInput(value)}
                onSelect={(val) => setLocationInput(val)}
                placeholder={locationPlaceholder}
                className="h-14 px-6 border-0 bg-transparent text-base placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Floating Gold Glassmorphic Search Button */}
        <Button
          onClick={() => handleSearch()}
          disabled={(!query.trim() && selectedCategories.length === 0) || isSearching}
          size="icon"
          className={cn(
            "absolute -right-2 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500",
            "hover:from-amber-300 hover:via-yellow-400 hover:to-orange-400",
            "border-2 border-white/30 backdrop-blur-sm",
            isSearching && "animate-pulse"
          )}
          style={{
            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
          }}
        >
          {isSearching ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Search className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>

      {/* Category Tiles - Smaller and More Refined */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategories.includes(category.value);
          const isCategorySearching = isSearching && isSelected;
          
          return (
            <button
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              disabled={isSearching}
              className={cn(
                "category-tile flex flex-col items-center justify-center p-2 md:p-3 rounded-xl relative group transition-all duration-200",
                isSelected 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary/50 shadow-lg' 
                  : 'text-foreground hover:border-primary/40 hover:shadow-md',
                isCategorySearching && 'animate-pulse'
              )}
            >
              {isCategorySearching && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm rounded-xl">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-primary" />
                </div>
              )}
              <IconComponent className={cn(
                "w-5 h-5 md:w-6 md:h-6 mb-1 transition-transform duration-300",
                !isSelected && "group-hover:scale-110"
              )} />
              <span className="text-[10px] md:text-xs font-medium text-center leading-tight">
                {category.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Analysis Display - Only show if there's actual data */}
      {lastSearchAnalysis && (lastSearchAnalysis.activities?.length > 0 || lastSearchAnalysis.ageGroups?.length > 0) && (
        <Card className="border-l-4 border-l-primary bg-muted/20">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-primary">Search Understanding:</div>
              <div className="flex flex-wrap gap-2">
                {lastSearchAnalysis.activities?.map((activity: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {activity}
                  </Badge>
                ))}
                {lastSearchAnalysis.ageGroups?.map((age: string, index: number) => (
                  <Badge key={index} variant="outline">
                    Ages {age}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConversationalSearch;