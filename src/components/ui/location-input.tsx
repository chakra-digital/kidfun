import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  onSelect?: (value: string) => void; // Fires when a suggestion is picked
  placeholder?: string;
  className?: string;
  disabled?: boolean; // For hiding clear button during search
  requireSelection?: boolean; // Only accept values chosen from suggestions
  onValidityChange?: (isValid: boolean) => void; // Notify parent about validity
}

export const LocationInput: React.FC<LocationInputProps> = ({ 
  value, 
  onChange,
  onSelect,
  placeholder = "Enter city, state, or ZIP code", 
  className,
  disabled = false,
  requireSelection = true,
  onValidityChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const suppressFetchRef = useRef<boolean>(false);
  const selectedRef = useRef<boolean>(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, inputValue]);

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
      if (suppressFetchRef.current) {
        return;
      }
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
    suppressFetchRef.current = false;
    selectedRef.current = false;
    setInputValue(newValue);
    // Keep parent in sync so searches use the typed value
    onChange(newValue);
    // Valid only when a suggestion is selected (or empty when requireSelection)
    const valid = !requireSelection || newValue.trim().length === 0 ? true : false;
    onValidityChange?.(valid);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const formattedValue = suggestion.description;
    suppressFetchRef.current = true; // prevent immediate refetch/reopen
    selectedRef.current = true;
    setInputValue(formattedValue);
    setIsOpen(false);
    setSuggestions([]);
    setIsLoading(false);
    // Commit to parent and blur to finalize selection
    onChange(formattedValue);
    onValidityChange?.(true);
    inputRef.current?.blur();
    // Small delay to ensure state updates, then trigger selection callback
    setTimeout(() => {
      onSelect?.(formattedValue);
    }, 50);
  };

  const handleInputBlur = () => {
    // Small delay to allow suggestion click to fire first
    setTimeout(() => {
      setIsOpen(false);
      const val = inputValue.trim();
      // Do NOT re-enable fetching here; wait until user types again
      if (!requireSelection || val.length === 0 || selectedRef.current) {
        if (inputValue !== value) {
          onChange(inputValue);
          onSelect?.(inputValue);
        }
        onValidityChange?.(true);
      } else {
        // Invalid free-typed value
        onValidityChange?.(false);
      }
    }, 150);
  };

  const handleClear = () => {
    setInputValue("");
    selectedRef.current = false;
    onChange("");
    onValidityChange?.(true);
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions[0]) {
                handleSuggestionClick(suggestions[0]);
              } else {
                if (requireSelection && inputValue.trim().length > 0) {
                  onValidityChange?.(false);
                  return; // keep focus until a suggestion is chosen
                }
                // Allow empty value when nothing is selected
                setIsOpen(false);
                onChange(inputValue);
                onSelect?.(inputValue);
                inputRef.current?.blur();
              }
            }
          }}
          onFocus={() => {
            /* keep suggestions closed until user types again */
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className={cn("pr-10", className)}
        />
        {isLoading ? (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : inputValue && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/60 rounded-full z-10"
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        ) : null}
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[9999] mt-2 w-full bg-white dark:bg-gray-800 backdrop-blur-md border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left text-sm hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
              onPointerDown={(e) => {
                // Prevent blur from firing before click
                e.preventDefault();
                e.stopPropagation();
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
