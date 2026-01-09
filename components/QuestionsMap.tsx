"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Navigation2, X } from "lucide-react";

interface Question {
  id: number;
  slug?: string;
  title: string;
  place_name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  score: number;
  answer_count: number;
  views: number;
  username: string;
  display_name: string;
  tags: { id: number; name: string }[];
}

interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  tag?: string;
  onQuestionSelect?: (questionId: number) => void;
}

export default function QuestionsMap({
  center = { lat: 7.8731, lng: 80.7718 }, // Sri Lanka center
  zoom = 8,
  tag,
  onQuestionSelect,
}: MapProps) {
  const [map, setMap] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsRef = useRef<string | null>(null);

  // Load Google Maps script (only once globally)
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript) {
      // Script already loaded, just initialize map
      if (window.google) {
        initMap();
      } else {
        // Script loading, wait for it
        existingScript.addEventListener("load", initMap);
        return () => {
          existingScript.removeEventListener("load", initMap);
        };
      }
    } else {
      // Load script for the first time
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAyDWij1xYKmOV857_CM_dq6fG5lH2FxNM&libraries=places`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";
      document.head.appendChild(script);

      script.onload = () => {
        initMap();
      };
    }
    // Don't remove script on cleanup - keep it for other components
    
    // Cleanup: clear markers and reset map state when unmounting
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      setMarkers([]);
      setQuestions([]);
      setMap(null);
      setIsMapReady(false);
    };
  }, []); // Re-run when component remounts

  // Re-center map when center prop changes
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom]);

  const initMap = () => {
    const mapElement = document.getElementById("map");
    if (!mapElement || !(window as any).google) return;

    const google = (window as any).google;
    const newMap = new google.maps.Map(mapElement, {
      center,
      zoom,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    setMap(newMap);
    setIsMapReady(true);

    // Debounced bounds changed listener to prevent API spam
    let boundsTimeout: NodeJS.Timeout;
    newMap.addListener("bounds_changed", () => {
      if (boundsTimeout) clearTimeout(boundsTimeout);
      
      boundsTimeout = setTimeout(() => {
        const bounds = newMap.getBounds();
        if (bounds) {
          fetchQuestionsInBounds(bounds);
        }
      }, 500); // 500ms debounce
    });

    // Initial load - fetch all questions
    setTimeout(() => {
      const bounds = newMap.getBounds();
      if (bounds) {
        fetchQuestionsInBounds(bounds);
      }
    }, 1000);
  };

  const fetchQuestionsInBounds = useCallback(
    async (bounds: google.maps.LatLngBounds) => {
      try {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const boundsParam = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`;

        // Prevent duplicate requests for the same bounds
        if (lastBoundsRef.current === boundsParam) {
          return;
        }
        lastBoundsRef.current = boundsParam;

        setLoading(true);

        const url = new URL("/api/questions/map-data", window.location.origin);
        url.searchParams.set("bounds", boundsParam);
        if (tag) url.searchParams.set("tag", tag);

        const response = await fetch(url.toString());
        const data = await response.json();

        setQuestions(data.questions || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setLoading(false);
      }
    },
    [tag]
  );

  // Update markers when questions change
  useEffect(() => {
    if (!map) return;

    const google = (window as any).google;
    if (!google) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    // Create new markers
    const newMarkers = questions.map((question) => {
      const marker = new google.maps.Marker({
        position: { lat: question.latitude, lng: question.longitude },
        map,
        title: question.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: question.answer_count > 0 ? "#10b981" : "#3b82f6",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedQuestion(question);
        map.panTo(marker.getPosition()!);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [questions, map]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const google = (window as any).google;
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          if (map && google) {
            map.setCenter(location);
            map.setZoom(12);

            // Add user marker
            new google.maps.Marker({
              position: location,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#ef4444",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
              },
              title: "Your location",
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div id="map" className="w-full h-full rounded-lg"></div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={getUserLocation}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Find questions near me"
        >
          <Navigation2 className="w-5 h-5 text-blue-600" />
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">Loading questions...</p>
        </div>
      )}

      {/* Question count */}
      {!loading && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {questions.length} question{questions.length !== 1 ? "s" : ""} on map
          </p>
        </div>
      )}

      {/* Selected question card */}
      {selectedQuestion && (
        <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 bg-white rounded-lg shadow-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                {selectedQuestion.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{selectedQuestion.place_name}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedQuestion(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{selectedQuestion.score}</span>
              votes
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">
                {selectedQuestion.answer_count}
              </span>
              answers
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{selectedQuestion.views}</span>
              views
            </span>
          </div>

          {selectedQuestion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedQuestion.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              by <span className="font-medium">{selectedQuestion.display_name || selectedQuestion.username}</span>
            </p>
            <a
              href={`/questions/${selectedQuestion.slug || selectedQuestion.id}`}
              onClick={(e) => {
                if (onQuestionSelect) {
                  e.preventDefault();
                  onQuestionSelect(selectedQuestion.id);
                }
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View question →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
