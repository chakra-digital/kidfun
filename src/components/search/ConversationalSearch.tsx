import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, MapPin, Star, ExternalLink, Calendar, Palette, Crown, ChefHat, Music, Languages, Trees, Drama, Gamepad2, FlaskConical, GraduationCap, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [whenFilter, setWhenFilter] = useState('');
  const [whereFilter, setWhereFilter] = useState('');
  const [lastSearchAnalysis, setLastSearchAnalysis] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    
    try {
      // Build enhanced query with filters and categories
      let enhancedQuery = query.trim();
      
      if (selectedCategories.length > 0) {
        enhancedQuery += ` focusing on ${selectedCategories.join(', ')}`;
      }
      
      if (whenFilter) {
        enhancedQuery += ` for ${whenFilter}`;
      }
      
      if (whereFilter) {
        enhancedQuery += ` in ${whereFilter}`;
      }

      const { data, error } = await supabase.functions.invoke('ai-provider-search', {
        body: { query: enhancedQuery }
      });

      if (error) throw error;

      const { results, searchAnalysis, newProvidersFound } = data;
      
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

      if (!compact) {
        setQuery('');
      }
    } catch (error: any) {
      console.error('Search error:', error);
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
    setSelectedCategories(prev => 
      prev.includes(categoryValue) 
        ? prev.filter(c => c !== categoryValue)
        : [...prev, categoryValue]
    );
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
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            size="sm"
            className="rounded-full px-4"
          >
            {isSearching ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
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
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            size="sm"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-4"
          >
            {isSearching ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* When and Where Filters */}
        <div className="flex gap-3 justify-center">
          <Button
            variant={whenFilter ? "default" : "outline"}
            onClick={() => setWhenFilter(whenFilter ? '' : 'this summer')}
            className="rounded-full px-6"
          >
            <Calendar className="w-4 h-4 mr-2" />
            When
          </Button>
          <Button
            variant={whereFilter ? "default" : "outline"}
            onClick={() => setWhereFilter(whereFilter ? '' : 'near me')}
            className="rounded-full px-6"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Where
          </Button>
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

      {/* Search Analysis Display */}
      {lastSearchAnalysis && (
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