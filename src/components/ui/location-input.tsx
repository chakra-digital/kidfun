import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface LocationSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter city, state, or ZIP code", 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Cancel previous request by setting a flag
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const currentController = abortControllerRef.current;
      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('get-place-autocomplete', {
          body: { input: inputValue }
        });

        // Check if this request was cancelled
        if (currentController.signal.aborted) {
          return;
        }

        if (error) throw error;

        if (data?.predictions) {
          const formattedSuggestions: LocationSuggestion[] = data.predictions.map((pred: any) => ({
            place_id: pred.place_id,
            description: pred.description,
            main_text: pred.structured_formatting?.main_text || pred.description,
            secondary_text: pred.structured_formatting?.secondary_text || ''
          }));
          setSuggestions(formattedSuggestions);
          setIsOpen(formattedSuggestions.length > 0);
        }
      } catch (err: any) {
        if (!currentController.signal.aborted) {
          console.error('Error fetching location suggestions:', err);
        }
      } finally {
        if (!currentController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(debounceTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Don't automatically call onChange here - only on blur or selection
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const formattedValue = suggestion.description;
    setInputValue(formattedValue);
    onChange(formattedValue);
    setIsOpen(false);
    setSuggestions([]);
    setIsLoading(false);
  };

  const handleInputBlur = () => {
    // Small delay to allow suggestion click to fire first
    setTimeout(() => {
      setIsOpen(false);
      // Update parent with final value only if changed
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 150);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => {
            // Only open if we have suggestions and not just selected one
            if (inputValue.length >= 2 && suggestions.length > 0 && isOpen === false) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={cn("pr-10 text-foreground bg-background/80 placeholder:text-muted-foreground/80", className)}
        />
        {isLoading ? (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : inputValue ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/60 rounded-full"
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        ) : null}
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-md border border-white/40 rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left text-sm hover:bg-primary/10 transition-colors border-b border-border/50 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
              onMouseDown={(e) => {
                // Prevent blur from firing before click
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
            >
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary/60 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{suggestion.main_text}</div>
                  {suggestion.secondary_text && (
                    <div className="text-xs text-muted-foreground mt-0.5">{suggestion.secondary_text}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
