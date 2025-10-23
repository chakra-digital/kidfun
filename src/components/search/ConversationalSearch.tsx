import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Sparkles, MapPin, Palette, Crown, ChefHat, Music, Languages, Trees, Drama, Gamepad2, FlaskConical, GraduationCap, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

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
    
    // Trigger a new search with the category
    if (newCategories.length > 0) {
      handleSearch(categoryValue);
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
            placeholder="Ask anything..."
            className="flex-1 rounded-full border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary"
            disabled={isSearching}
          />
          <Button 
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
          >
            {isSearching ? (
              <Sparkles className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5" />
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
            placeholder="Ask anything"
            className="w-full h-14 px-6 rounded-full border-2 border-input bg-background text-foreground text-lg placeholder:text-muted-foreground focus:border-primary"
            disabled={isSearching}
          />
          <Button 
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full h-10 w-10"
          >
            {isSearching ? (
              <div className="relative">
                <Sparkles className="w-5 h-5 animate-spin text-white" />
              </div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Location Filter */}
        <div className="flex gap-3 justify-center">
          <Popover open={isWhereOpen} onOpenChange={setIsWhereOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={whereFilter ? "default" : "outline"}
                className={cn(
                  "rounded-full px-6",
                  !whereFilter && "bg-background text-foreground border-input hover:bg-accent"
                )}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {whereFilter || 'Where'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="center">
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <Input
                    placeholder="Enter city or zip code"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="mb-3"
                  />
                </div>
                <div className="space-y-2">
                  {userLocation && (
                    <button
                      onClick={() => {
                        setLocationInput(`${userLocation.lat},${userLocation.lng}`);
                        setIsWhereOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent flex items-center gap-3"
                    >
                      <MapPin className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Nearby</div>
                        <div className="text-sm text-muted-foreground">Use my current location</div>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setLocationInput('Austin, TX');
                      setIsWhereOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent flex items-center gap-3"
                  >
                    <MapPin className="w-4 h-4" />
                    <div className="font-medium">Austin, TX</div>
                  </button>
                </div>
                {locationInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setLocationInput('');
                      setIsWhereOpen(false);
                    }}
                  >
                    Clear location
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Category Tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategories.includes(category.value);
          
          return (
            <button
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:border-primary hover:bg-accent'
              }`}
            >
              <IconComponent className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center leading-tight">
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