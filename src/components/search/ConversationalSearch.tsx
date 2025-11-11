import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Send, Sparkles, MapPin, Palette, Crown, ChefHat, Music, Languages, Trees, Drama, Gamepad2, FlaskConical, GraduationCap, Users, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { LocationInput } from '@/components/ui/location-input';
import { searchCache } from '@/lib/searchCache';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

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
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [isWhereOpen, setIsWhereOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Animated emojis (separate from placeholder text now)
  const activityEmojis = ['⚽', '🎨', '🎭', '🏊', '⛺', '🎪'];
  const locationEmojis = ['📍', '🗺️', '🌍', '✈️', '🧭'];
  const dateEmojis = ['🗓️', '📅', '⏰', '📆'];
  const [currentEmoji, setCurrentEmoji] = useState(activityEmojis[0]);
  const [locationEmoji, setLocationEmoji] = useState(locationEmojis[0]);
  const [dateEmoji, setDateEmoji] = useState(dateEmojis[0]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  
  useEffect(() => {
    let activityIndex = 0;
    let locationIndex = 0;
    let dateIndex = 0;
    
    // Activity emoji changes every 2 seconds
    const activityInterval = setInterval(() => {
      activityIndex = (activityIndex + 1) % activityEmojis.length;
      setCurrentEmoji(activityEmojis[activityIndex]);
    }, 2000);
    
    // Location emoji changes every 2 seconds, but offset by 1 second
    const locationTimeout = setTimeout(() => {
      const locationInterval = setInterval(() => {
        locationIndex = (locationIndex + 1) % locationEmojis.length;
        setLocationEmoji(locationEmojis[locationIndex]);
      }, 2000);
      
      return () => clearInterval(locationInterval);
    }, 1000);
    
    // Date emoji changes every 2 seconds, but offset by 0.5 seconds
    const dateTimeout = setTimeout(() => {
      const dateInterval = setInterval(() => {
        dateIndex = (dateIndex + 1) % dateEmojis.length;
        setDateEmoji(dateEmojis[dateIndex]);
      }, 2000);
      
      return () => clearInterval(dateInterval);
    }, 500);
    
    return () => {
      clearInterval(activityInterval);
      clearTimeout(locationTimeout);
      clearTimeout(dateTimeout);
    };
  }, []);

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
    
    // Guard: require valid suggestion when something is typed
    if (currentLocationInput && !isLocationValid) {
      toast({
        title: "Choose a location",
        description: "Please pick a location from the suggestions.",
        variant: "destructive",
      });
      return;
    }
    
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
      <div className="relative z-[1000]">
        <Card className="backdrop-blur-md bg-white dark:bg-white border-0 rounded-3xl" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)' }}>
          <CardContent className="p-0">
            {/* Activity Input - Taller */}
            <div className="relative border-b border-gray-300">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[28px] pointer-events-none z-10 opacity-100">
                {currentEmoji}
              </span>
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What are you looking for?"
                className="h-20 pl-16 pr-6 border-0 bg-transparent text-xl font-normal text-gray-600 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:text-gray-600 disabled:opacity-100 rounded-none"
                disabled={isSearching}
              />
            </div>
            
            {/* Date Input - Middle */}
            <div className="relative border-b border-gray-300">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[26px] pointer-events-none z-10 opacity-100">
                {dateEmoji}
              </span>
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="w-full h-14 pl-16 pr-6 text-left border-0 bg-transparent text-xl font-normal text-gray-600 hover:bg-gray-50/50 transition-colors focus:outline-none disabled:opacity-50"
                    disabled={isSearching}
                  >
                    {dateMode === 'single' && selectedDate ? (
                      <span>{format(selectedDate, 'PPP')}</span>
                    ) : dateMode === 'range' && dateRange.from ? (
                      <span>
                        {format(dateRange.from, 'PP')}
                        {dateRange.to && ` - ${format(dateRange.to, 'PP')}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">When</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                  <div className="p-3 border-b border-border bg-background">
                    <div className="flex gap-2">
                      <Button
                        variant={dateMode === 'single' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setDateMode('single');
                          setDateRange(undefined);
                        }}
                        className="flex-1"
                      >
                        Single Date
                      </Button>
                      <Button
                        variant={dateMode === 'range' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setDateMode('range');
                          setSelectedDate(undefined);
                        }}
                        className="flex-1"
                      >
                        Date Range
                      </Button>
                    </div>
                  </div>
                  {dateMode === 'single' ? (
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) setIsDatePopoverOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  ) : (
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        if (range?.from && range?.to) setIsDatePopoverOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      numberOfMonths={2}
                    />
                  )}
                  <div className="p-3 border-t border-border bg-background flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(undefined);
                        setDateRange(undefined);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Location Input - Shorter */}
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[26px] pointer-events-none z-10 opacity-100">
                {locationEmoji}
              </span>
              <LocationInput
                value={locationInput}
                onChange={(value) => setLocationInput(value)}
                onSelect={(val) => setLocationInput(val)}
                placeholder="Location"
                className="h-14 pl-16 pr-20 border-0 bg-transparent text-xl font-normal text-gray-600 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                disabled={isSearching}
                requireSelection={true}
                onValidityChange={setIsLocationValid}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Ultra-Bright Search Button - Maximum Visibility */}
        <Button
          onClick={() => handleSearch()}
          disabled={((!query.trim() && selectedCategories.length === 0) || isSearching || (locationInput && !isLocationValid))}
          size="icon"
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-16 w-16 rounded-full transition-all duration-300 z-20",
            "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 shadow-2xl",
            "hover:from-yellow-300 hover:via-yellow-400 hover:to-amber-400 hover:scale-110",
            "disabled:cursor-not-allowed",
            isSearching && "animate-pulse"
          )}
          style={{
            boxShadow: '0 12px 56px rgba(251, 191, 36, 0.9), 0 0 0 8px rgba(255, 255, 255, 1), 0 0 80px rgba(251, 191, 36, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
          }}
        >
          {isSearching ? (
            <Loader2 className="w-7 h-7 text-gray-900 animate-spin drop-shadow-md" />
          ) : (
            <Search className="w-7 h-7 text-gray-900 drop-shadow-md" />
          )}
        </Button>
      </div>

      {/* Error message popout below the card */}
      {locationInput && !isLocationValid && (
        <div className="flex justify-center -mt-2 mb-4">
          <div className="rounded-full px-4 py-1.5 text-sm font-semibold text-gray-900 shadow-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 border border-white/40 backdrop-blur">
            Please choose a location from the suggestions.
          </div>
        </div>
      )}

      {/* Category Tiles - Uniform Size and Spacing */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-8">
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
                "aspect-square flex flex-col items-center justify-center gap-2 rounded-xl relative group transition-all duration-200 border p-4",
                isSelected 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg' 
                  : 'bg-white/60 dark:bg-background/60 backdrop-blur-sm border-gray-200/50 dark:border-border/50 text-gray-600 dark:text-foreground/80 hover:border-primary/30 hover:shadow-sm hover:bg-white/70 dark:hover:bg-background/70',
                isCategorySearching && 'animate-pulse'
              )}
            >
              {isCategorySearching && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              <IconComponent className={cn(
                "w-7 h-7 transition-transform duration-300",
                !isSelected && "group-hover:scale-110"
              )} />
              <span className="text-xs font-medium text-center leading-tight">
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