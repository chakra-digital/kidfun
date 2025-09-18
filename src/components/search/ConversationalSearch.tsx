import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, MapPin, Star, ExternalLink } from 'lucide-react';
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
}

const ConversationalSearch: React.FC<ConversationalSearchProps> = ({ 
  onResultsUpdate, 
  className = "" 
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{
    query: string;
    timestamp: Date;
    resultCount: number;
  }>>([]);
  const [lastSearchAnalysis, setLastSearchAnalysis] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-provider-search', {
        body: { query: query.trim() }
      });

      if (error) throw error;

      const { results, searchAnalysis, newProvidersFound } = data;
      
      // Update results
      onResultsUpdate(results || []);
      setLastSearchAnalysis(searchAnalysis);
      
      // Add to search history
      setSearchHistory(prev => [{
        query: query.trim(),
        timestamp: new Date(),
        resultCount: results?.length || 0
      }, ...prev.slice(0, 4)]); // Keep last 5 searches

      // Show success message
      toast({
        title: "Search Complete",
        description: `Found ${results?.length || 0} relevant providers${
          newProvidersFound > 0 ? ` (${newProvidersFound} new discoveries!)` : ''
        }`,
      });

      setQuery('');
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

  const getSuggestionQueries = () => {
    return [
      "Soccer classes for 8 year olds",
      "Art camps this summer",
      "Swimming lessons near me",
      "STEM activities for middle schoolers",
      "Dance classes for beginners"
    ];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Input */}
      <Card className="border-2 border-primary bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Ask me anything about activities for your kids</h3>
              <p className="text-sm text-muted-foreground">I'll help you find the perfect activities using AI-powered search</p>
            </div>
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 'Find soccer camps for my 10 year old daughter near downtown'"
                className="flex-1 text-foreground placeholder:text-muted-foreground border-2 border-border focus:border-primary"
                disabled={isSearching}
              />
              <Button 
                onClick={handleSearch}
                disabled={!query.trim() || isSearching}
                size="lg"
                className="px-6"
              >
                {isSearching ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Analysis Display */}
      {lastSearchAnalysis && (
        <Card className="border-l-4 border-l-primary">
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

      {/* Quick Suggestions */}
      {searchHistory.length === 0 && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-sm font-medium text-foreground mb-2">Try these popular searches:</div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {getSuggestionQueries().map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setQuery(suggestion)}
                className="text-xs bg-white hover:bg-primary hover:text-primary-foreground border-border text-foreground"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {searchHistory.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Recent searches:</div>
          <div className="space-y-1">
            {searchHistory.map((search, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => setQuery(search.query)}
                className="h-auto p-2 justify-start"
              >
                <div className="text-left">
                  <div className="text-sm">{search.query}</div>
                  <div className="text-xs text-muted-foreground">
                    {search.resultCount} results • {search.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationalSearch;