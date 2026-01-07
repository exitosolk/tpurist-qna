"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
  fromCache?: boolean;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, placeId?: string, place?: any) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  onPlaceSelected?: (place: any, distance?: number) => void;
  fromPlaceId?: string; // For distance calculation
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter location",
  label,
  required = false,
  onPlaceSelected,
  fromPlaceId,
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(7));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch predictions when value changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/places?input=${encodeURIComponent(value)}&sessiontoken=${sessionToken}`
        );
        const data = await response.json();
        setPredictions(data.predictions || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching predictions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, sessionToken]);

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    onChange(prediction.description, prediction.place_id);
    setIsOpen(false);

    // Fetch full place details if callback provided
    if (onPlaceSelected) {
      try {
        const response = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            place_id: prediction.place_id,
            from_place_id: fromPlaceId,
          }),
        });
        const data = await response.json();
        onPlaceSelected(data.place, data.distance);
      } catch (error) {
        console.error("Error fetching place details:", error);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={required}
          autoComplete="off"
        />
        <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-2.5 w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-start gap-2 transition"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {prediction.structured_formatting?.main_text || prediction.description}
                </div>
                {prediction.structured_formatting?.secondary_text && (
                  <div className="text-sm text-gray-600 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                )}
                {prediction.fromCache && (
                  <div className="text-xs text-green-600 mt-1">⚡ Fast cached result</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && predictions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          No locations found. Try a different search term.
        </div>
      )}
    </div>
  );
}
