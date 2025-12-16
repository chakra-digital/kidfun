import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Loader2, MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface AddActivityDialogProps {
  onActivityAdded?: () => void;
}

export const AddActivityDialog: React.FC<AddActivityDialogProps> = ({ onActivityAdded }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state - Location first, then activity/provider search
  const [areaLocation, setAreaLocation] = useState('');
  const [activityName, setActivityName] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch suggestions as user types activity name
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (activityName.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSearching(true);

      try {
        // Pass location for bias if user entered one
        const requestBody: { input: string; type: string; location?: string } = {
          input: activityName,
          type: 'establishment'
        };
        
        // Add location bias if area is specified
        if (areaLocation.trim()) {
          requestBody.location = areaLocation.trim();
        }

        const { data, error } = await supabase.functions.invoke('get-place-autocomplete', {
          body: requestBody
        });

        if (error) throw error;

        if (data?.predictions) {
          const formatted: PlaceSuggestion[] = data.predictions.map((pred: any) => ({
            place_id: pred.place_id,
            description: pred.description,
            main_text: pred.structured_formatting?.main_text || pred.description,
            secondary_text: pred.structured_formatting?.secondary_text || ''
          }));
          setSuggestions(formatted);
          setShowSuggestions(formatted.length > 0);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching suggestions:', err);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, [activityName, areaLocation]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionSelect = (suggestion: PlaceSuggestion) => {
    setActivityName(suggestion.main_text);
    setSelectedAddress(suggestion.secondary_text);
    setSelectedPlaceId(suggestion.place_id);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activityName.trim()) return;

    setSaving(true);
    try {
      // Combine selected address and user's area for notes
      const locationInfo = selectedAddress || areaLocation;
      
      const { error } = await supabase.from('saved_activities').insert({
        user_id: user.id,
        provider_name: activityName.trim(),
        activity_name: null,
        scheduled_date: date?.toISOString() || null,
        notes: [locationInfo, notes.trim()].filter(Boolean).join(' • ') || null,
        status: 'saved',
        provider_id: null
      });

      if (error) throw error;

      toast.success('Activity added! +10 points 🎉');
      resetForm();
      setOpen(false);
      onActivityAdded?.();
    } catch (err) {
      console.error('Error saving activity:', err);
      toast.error('Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setAreaLocation('');
    setActivityName('');
    setDate(undefined);
    setNotes('');
    setSelectedPlaceId(null);
    setSelectedAddress('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Location/Area first - helps with search bias */}
          <div className="space-y-2">
            <Label htmlFor="area-location">Location / Area (optional)</Label>
            <Input
              id="area-location"
              value={areaLocation}
              onChange={(e) => setAreaLocation(e.target.value)}
              placeholder="Austin, TX or Tarrytown..."
            />
            <p className="text-xs text-muted-foreground">
              Enter your area to get better activity suggestions
            </p>
          </div>

          {/* Activity Name with Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity or Place Name *</Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="activity-name"
                value={activityName}
                onChange={(e) => {
                  setActivityName(e.target.value);
                  setSelectedPlaceId(null);
                  setSelectedAddress('');
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Soccer practice, Birthday party, Art class..."
                autoComplete="off"
                className="pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-auto"
                >
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-start gap-2"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{suggestion.main_text}</div>
                        {suggestion.secondary_text && (
                          <div className="text-xs text-muted-foreground truncate">{suggestion.secondary_text}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPlaceId && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Linked to: {selectedAddress}
              </p>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details to remember..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!activityName.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};