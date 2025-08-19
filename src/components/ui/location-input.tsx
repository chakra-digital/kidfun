import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSuggestion {
  id: string;
  display: string;
  city: string;
  state: string;
  zip?: string;
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Mock location data - in production this would come from a geocoding API
const MOCK_LOCATIONS: LocationSuggestion[] = [
  { id: "1", display: "Austin, TX 78745", city: "Austin", state: "TX", zip: "78745" },
  { id: "2", display: "Austin, TX 78701", city: "Austin", state: "TX", zip: "78701" },
  { id: "3", display: "Austin, TX 78704", city: "Austin", state: "TX", zip: "78704" },
  { id: "4", display: "Round Rock, TX 78681", city: "Round Rock", state: "TX", zip: "78681" },
  { id: "5", display: "Cedar Park, TX 78613", city: "Cedar Park", state: "TX", zip: "78613" },
  { id: "6", display: "Pflugerville, TX 78660", city: "Pflugerville", state: "TX", zip: "78660" },
];

export const LocationInput: React.FC<LocationInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter city, state, or ZIP code", 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.length > 2) {
      // Filter suggestions based on input
      const filtered = MOCK_LOCATIONS.filter(location =>
        location.display.toLowerCase().includes(newValue.toLowerCase()) ||
        location.city.toLowerCase().includes(newValue.toLowerCase()) ||
        location.state.toLowerCase().includes(newValue.toLowerCase()) ||
        (location.zip && location.zip.includes(newValue))
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setInputValue(suggestion.display);
    onChange(suggestion.display);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputBlur = () => {
    // Delay to allow suggestion click to register
    setTimeout(() => {
      onChange(inputValue);
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
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => {
            if (inputValue.length > 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={cn("pl-10 pr-10", className)}
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-2 text-muted-foreground flex-shrink-0" />
                <span>{suggestion.display}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};