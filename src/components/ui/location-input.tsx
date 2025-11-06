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
  // Florida locations
  { id: "fl1", display: "Fort Myers, FL 33901", city: "Fort Myers", state: "FL", zip: "33901" },
  { id: "fl2", display: "Fort Myers, FL 33907", city: "Fort Myers", state: "FL", zip: "33907" },
  { id: "fl3", display: "Fort Myers, FL 33916", city: "Fort Myers", state: "FL", zip: "33916" },
  { id: "fl4", display: "Naples, FL 34102", city: "Naples", state: "FL", zip: "34102" },
  { id: "fl5", display: "Cape Coral, FL 33904", city: "Cape Coral", state: "FL", zip: "33904" },
  { id: "fl6", display: "Miami, FL 33101", city: "Miami", state: "FL", zip: "33101" },
  { id: "fl7", display: "Tampa, FL 33602", city: "Tampa", state: "FL", zip: "33602" },
  { id: "fl8", display: "Orlando, FL 32801", city: "Orlando", state: "FL", zip: "32801" },
  // Texas locations
  { id: "tx1", display: "Austin, TX 78745", city: "Austin", state: "TX", zip: "78745" },
  { id: "tx2", display: "Austin, TX 78701", city: "Austin", state: "TX", zip: "78701" },
  { id: "tx3", display: "Austin, TX 78704", city: "Austin", state: "TX", zip: "78704" },
  { id: "tx4", display: "Round Rock, TX 78681", city: "Round Rock", state: "TX", zip: "78681" },
  { id: "tx5", display: "Cedar Park, TX 78613", city: "Cedar Park", state: "TX", zip: "78613" },
  { id: "tx6", display: "Pflugerville, TX 78660", city: "Pflugerville", state: "TX", zip: "78660" },
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
    // Only update if user manually typed (not from suggestion click)
    setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 200);
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
            if (inputValue.length > 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={cn("pr-10 text-foreground placeholder:text-muted-foreground", className)}
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/60 rounded-full"
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        )}
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-md border border-white/40 rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-primary/10 transition-colors border-b border-border/50 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary/60 flex-shrink-0" />
                <span className="font-medium">{suggestion.display}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};