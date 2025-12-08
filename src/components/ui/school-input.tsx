import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraduationCap, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SchoolSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface SchoolInputProps {
  value: string;
  onChange: (value: string, placeId?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SchoolInput: React.FC<SchoolInputProps> = ({
  value,
  onChange,
  placeholder = "Search for your school...",
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SchoolSuggestion[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const suppressFetchRef = useRef<boolean>(false);
  const selectedRef = useRef<boolean>(false);

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

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const currentController = abortControllerRef.current;
      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('get-place-autocomplete', {
          body: { input: inputValue, type: 'school' }
        });

        if (currentController.signal.aborted) {
          return;
        }

        if (error) throw error;

        if (data?.predictions) {
          const formattedSuggestions: SchoolSuggestion[] = data.predictions.map((pred: any) => ({
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
          console.error('Error fetching school suggestions:', err);
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
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: SchoolSuggestion) => {
    suppressFetchRef.current = true;
    selectedRef.current = true;
    setInputValue(suggestion.main_text);
    setIsOpen(false);
    setSuggestions([]);
    setIsLoading(false);
    onChange(suggestion.main_text, suggestion.place_id);
    inputRef.current?.blur();
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleClear = () => {
    setInputValue("");
    selectedRef.current = false;
    onChange("", undefined);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              }
            }
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pl-10 pr-16", className)}
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
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted/60 rounded-full"
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        ) : null}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[9999] mt-2 w-full bg-background border border-border rounded-xl shadow-2xl max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left text-sm hover:bg-primary/10 transition-colors border-b border-border last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionClick(suggestion);
              }}
            >
              <div className="flex items-start">
                <GraduationCap className="h-4 w-4 mr-2 mt-0.5 text-primary/60 flex-shrink-0" />
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
