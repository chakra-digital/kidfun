import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Sparkles, MapPin, Palette, Crown, ChefHat, Music, Languages, Trees, Drama, Gamepad2, FlaskConical, GraduationCap, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { LocationInput } from '@/components/ui/location-input';

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
  className?: string;
  compact?: boolean;
}

const ConversationalSearch: React.FC<ConversationalSearchProps> = ({ 
  onResultsUpdate, 
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

  const handleSearch = async (categoryOverride?: string) => {
    const searchQuery = query.trim();
    const searchCategory = categoryOverride || (selectedCategories.length > 0 ? selectedCategories.join(', ') : '');
    
    if (!searchQuery && !searchCategory) return;
    if (isSearching) return;
    
    // Clear previous search results and analysis when starting new search
    onResultsUpdate([]);
    setLastSearchAnalysis(null);

    setIsSearching(true);
    console.log('Starting AI search...');
    
    try {
      // Build enhanced query with category
      let enhancedQuery = searchQuery || `Find ${searchCategory} activities`;
      
      if (searchCategory && searchQuery) {
        enhancedQuery += ` focusing on ${searchCategory}`;
      }

      // Determine location to use
      let searchLocation = whereFilter;
      
      if (!searchLocation && userLocation) {
        // Use reverse geocoding to get location name from coordinates
        searchLocation = `${userLocation.lat},${userLocation.lng}`;
      }
      
      if (!searchLocation) {
        searchLocation = 'Austin, TX'; // Final fallback
      }

      console.log('Enhanced query:', enhancedQuery, 'Location:', searchLocation);

      const { data, error } = await supabase.functions.invoke('ai-provider-search', {
        body: { query: enhancedQuery, location: searchLocation }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const { results, searchAnalysis, newProvidersFound, fromCache } = data;
      
      console.log('Search results:', {
        resultsCount: results?.length,
        searchAnalysis,
        newProvidersFound,
        fromCache
      });
      
      // Update results
      onResultsUpdate(results || []);
      setLastSearchAnalysis(searchAnalysis);

      // Show success message
      toast({
        title: fromCache ? "Instant Results" : "Search Complete",
        description: `Found ${results?.length || 0} relevant providers${
          newProvidersFound > 0 ? ` (${newProvidersFound} new discoveries!)` : ''
        }${fromCache ? ' (from cache)' : ''}`,
      });

      if (!compact) {
        setQuery('');
      }
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
      {/* Main Search Input */}
      <div className="space-y-4">
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What are you looking for?"
            className="glass-input w-full h-16 px-6 rounded-full text-lg text-foreground bg-background/80 placeholder:text-muted-foreground/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
            disabled={isSearching}
          />
          <Button 
            onClick={() => handleSearch()}
            disabled={(!query.trim() && selectedCategories.length === 0) || isSearching}
            size="icon"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-14 w-14 bg-gradient-to-br from-primary to-primary/80 transition-all duration-300",
              isSearching 
                ? "scale-110 animate-[pulse_1s_ease-in-out_infinite]" 
                : "hover:scale-110 hover:from-primary/90 hover:to-primary/70"
            )}
            style={isSearching ? {
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)',
              animation: 'pulse 1s ease-in-out infinite, sparkle 2s ease-in-out infinite'
            } : {}}
          >
            {isSearching ? (
              <div className="flex flex-col items-center justify-center relative">
                <Loader2 className="w-7 h-7 animate-spin" />
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 animate-ping opacity-75" />
              </div>
            ) : (
              <Send className="w-7 h-7" />
            )}
          </Button>
        </div>

        {/* Location Filter - Enhanced with Autocomplete */}
        <div className="flex gap-3 justify-center">
          <div className="relative w-full max-w-md">
            <LocationInput
              value={locationInput}
              onChange={(value) => setLocationInput(value)}
              placeholder="Enter city, state, or ZIP code"
              className="glass-input h-12 rounded-full px-12 text-base bg-background/80 focus:ring-2 focus:ring-primary/20"
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Category Tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
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
                "category-tile flex flex-col items-center justify-center p-5 rounded-2xl relative group",
                isSelected 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary/50 shadow-[0_8px_24px_0_rgba(52,144,220,0.3)]' 
                  : 'text-foreground hover:border-primary/40',
                isCategorySearching && 'animate-pulse'
              )}
            >
              {isCategorySearching && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm rounded-2xl">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              <IconComponent className={cn(
                "w-9 h-9 mb-2 transition-transform duration-300",
                !isSelected && "group-hover:scale-110"
              )} />
              <span className="text-sm font-semibold text-center leading-tight">
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