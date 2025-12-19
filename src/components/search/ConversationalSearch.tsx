import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

export interface ConversationalSearchRef {
  triggerSearch: (query: string) => void;
}

const ConversationalSearch = forwardRef<ConversationalSearchRef, ConversationalSearchProps>(
  ({ onResultsUpdate, onSearchStart, className = "", compact = false }, ref) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [searchDuration, setSearchDuration] = useState<number>(0);
  const [locationInput, setLocationInput] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [lastSearchAnalysis, setLastSearchAnalysis] = useState<any>(null);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [isWhereOpen, setIsWhereOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Expose triggerSearch method via ref
  useImperativeHandle(ref, () => ({
    triggerSearch: (newQuery: string) => {
      setQuery(newQuery);
      // Don't auto-search, just populate the query
      toast({
        title: "Ready to search",
        description: "Enter your location to find " + newQuery,
      });
    }
  }));

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

  // Timer to track search duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching && searchStartTime) {
      interval = setInterval(() => {
        setSearchDuration(Math.floor((Date.now() - searchStartTime) / 1000));
      }, 1000);
    } else {
      setSearchDuration(0);
    }
    return () => clearInterval(interval);
  }, [isSearching, searchStartTime]);

  const handleSearch = async (categoryOverride?: string, locationOverride?: string, queryOverride?: string) => {
    const searchQuery = (queryOverride || query).trim();
    
    if (!searchQuery) return;
    if (isSearching) return;
    
    // Use query directly without category appending
    const enhancedQuery = searchQuery;

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
    
    // Show skeleton results immediately for progressive loading feel
    const skeletonResults = Array(6).fill(null).map((_, i) => ({
      id: `skeleton-${i}`,
      business_name: 'Loading...',
      location: 'Searching nearby...',
      isLoading: true
    }));
    onResultsUpdate(skeletonResults as any);
    setLastSearchAnalysis(null);
    onSearchStart?.();

    setIsSearching(true);
    setSearchStartTime(Date.now());
    console.log('Starting AI search...');
    
    try {
      // Add timeout to prevent hanging requests when app goes to background
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Search request timed out')), 30000); // 30 second timeout
      });

      const searchPromise = supabase.functions.invoke('ai-provider-search', {
        body: { query: enhancedQuery, location: searchLocation }
      });

      const { data, error } = await Promise.race([searchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to connect to search service');
      }

      if (!data) {
        throw new Error('No data returned from search function');
      }

      // Check for API errors in the response
      if (data.error) {
        if (data.error.includes('RATE_LIMIT') || data.error.includes('rate limit')) {
          throw new Error('RATE_LIMIT: Too many searches. Please wait a moment.');
        } else if (data.error.includes('API_QUOTA') || data.error.includes('quota')) {
          throw new Error('API_QUOTA: Google API quota exceeded.');
        } else {
          throw new Error(data.error);
        }
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
      
      // More specific error messaging
      let errorTitle = "Search Error";
      let errorMessage = "Failed to search providers. Please try again.";
      
      if (error.message?.includes('timeout')) {
        errorMessage = "Search took too long. Please check your connection and try again.";
      } else if (error.message?.includes('Failed to send')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('RATE_LIMIT')) {
        errorTitle = "Rate Limit Exceeded";
        errorMessage = "Too many searches. Please wait a moment and try again.";
      } else if (error.message?.includes('API_QUOTA')) {
        errorTitle = "API Quota Exceeded";
        errorMessage = "Google API quota has been exceeded. Please contact support or check your Google Cloud billing.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setSearchStartTime(null);
      setSearchDuration(0);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
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
    <div className={`max-w-2xl mx-auto space-y-4 md:space-y-6 ${className}`}>
      {/* Redesigned Stacked Search Box */}
      <div className="relative z-[1000]">
        <Card className="backdrop-blur-xl bg-card border-0 rounded-2xl shadow-xl">
          <CardContent className="p-0">
            {/* Activity Input - Taller */}
            <div className="relative border-b border-border">
              <span className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-[22px] md:text-[28px] pointer-events-none z-10 opacity-100">
                {currentEmoji}
              </span>
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What are you looking for?"
                className="h-16 md:h-20 pl-12 md:pl-16 pr-4 md:pr-6 border-0 bg-transparent text-base md:text-lg font-normal text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 disabled:text-foreground disabled:opacity-100 rounded-none shadow-none"
                disabled={isSearching}
              />
            </div>
            
            {/* Date Input - Middle */}
            <div className="relative border-b border-border">
              <span className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-[20px] md:text-[26px] pointer-events-none z-10 opacity-100">
                {dateEmoji}
              </span>
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="w-full h-12 md:h-14 pl-12 md:pl-16 pr-4 md:pr-6 text-left border-0 bg-transparent text-base md:text-lg font-normal text-foreground hover:bg-muted/50 transition-colors focus:outline-none disabled:opacity-50"
                    disabled={isSearching}
                  >
                    {dateMode === 'single' && selectedDate ? (
                      <span className="text-base md:text-lg">{format(selectedDate, 'PPP')}</span>
                    ) : dateMode === 'range' && dateRange?.from ? (
                      <span className="text-base md:text-lg">
                        {format(dateRange?.from as Date, 'PP')}
                        {dateRange?.to && ` - ${format(dateRange?.to as Date, 'PP')}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-base md:text-lg">When</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border shadow-xl rounded-xl" align="start" sideOffset={8}>
                  <div className="p-3 border-b border-border bg-popover rounded-t-xl">
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
                  <div className="p-3 border-t border-border bg-popover rounded-b-xl flex justify-end gap-2">
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
              <span className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-[20px] md:text-[26px] pointer-events-none z-10 opacity-100">
                {locationEmoji}
              </span>
              <LocationInput
                value={locationInput}
                onChange={(value) => setLocationInput(value)}
                onSelect={(val) => setLocationInput(val)}
                placeholder="Location"
                className="h-12 md:h-14 pl-12 md:pl-16 pr-16 md:pr-20 border-0 bg-transparent text-base md:text-lg font-normal text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none"
                disabled={isSearching}
                requireSelection={true}
                onValidityChange={setIsLocationValid}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Ultra-Bright Search Button - Centered at bottom using margin instead of translate to avoid layout shifts */}
        <div className="flex flex-col items-center mt-6 md:mt-8">
          <Button
            onClick={() => handleSearch()}
            disabled={(!query.trim() || isSearching || (locationInput && !isLocationValid))}
            size="icon"
            className={cn(
              "h-16 w-16 md:h-20 md:w-20 rounded-full transition-all duration-300",
              "bg-gradient-to-br from-primary via-primary to-primary/90 shadow-xl",
              "hover:shadow-glow hover:scale-110",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isSearching && "animate-pulse"
            )}
            style={{
              boxShadow: isSearching ? undefined : '0 12px 40px hsl(var(--primary) / 0.4), 0 0 0 6px hsl(var(--background)), 0 0 60px hsl(var(--primary) / 0.3)'
            }}
          >
            {isSearching ? (
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground animate-spin" />
            ) : (
              <Search className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
            )}
          </Button>
          
          {/* Search progress indicator */}
          {isSearching && searchDuration > 2 && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border whitespace-nowrap">
                Searching... {searchDuration}s
                {searchDuration > 8 && <span className="ml-1">(Finding best matches)</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message popout below the card */}
      {locationInput && !isLocationValid && (
        <div className="flex justify-center -mt-2 mb-4">
          <div className="rounded-full px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg bg-primary border border-primary/20 backdrop-blur">
            Please choose a location from the suggestions.
          </div>
        </div>
      )}

      {/* Search Analysis Display - Only show if there's actual data */}
      {lastSearchAnalysis && (lastSearchAnalysis.activities?.length > 0 || lastSearchAnalysis.ageGroups?.length > 0) && (
        <Card className="border-l-4 border-l-primary bg-muted/30 rounded-xl">
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
});

ConversationalSearch.displayName = "ConversationalSearch";

export default ConversationalSearch;