"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuestionsMap from "@/components/QuestionsMap";
import { MapPin, List, Navigation2, Filter } from "lucide-react";

interface Question {
  id: number;
  title: string;
  body: string;
  place_name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  distance: number;
  score: number;
  answer_count: number;
  views: number;
  created_at: string;
  username: string;
  display_name: string;
  tags: { id: number; name: string }[];
}

export default function QuestionsMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number>(8);
  const [radius, setRadius] = useState(50); // km
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Read URL parameters on mount
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const urlRadius = searchParams.get("radius");
    const zoom = searchParams.get("zoom");

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const location = { lat: latitude, lng: longitude };
      
      setMapCenter(location);
      setUserLocation(location);
      
      if (zoom) {
        setMapZoom(parseInt(zoom));
      } else {
        setMapZoom(14); // Zoom in closer when specific location provided
      }
      
      if (urlRadius) {
        setRadius(parseInt(urlRadius));
      }
      
      // Fetch nearby questions for list view
      fetchNearbyQuestions(latitude, longitude, parseInt(urlRadius || "50"));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPopularTags();
  }, []);

  const fetchPopularTags = async () => {
    try {
      const response = await fetch("/api/tags?limit=20");
      const data = await response.json();
      setAvailableTags(data.tags.map((t: any) => t.name));
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const fetchNearbyQuestions = async (lat: number, lng: number, queryRadius?: number) => {
    setLoading(true);
    try {
      const url = new URL("/api/questions/nearby", window.location.origin);
      url.searchParams.set("latitude", lat.toString());
      url.searchParams.set("longitude", lng.toString());
      url.searchParams.set("radius", (queryRadius || radius).toString());
      if (selectedTag) url.searchParams.set("tag", selectedTag);

      const response = await fetch(url.toString());
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching nearby questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          fetchNearbyQuestions(location.lat, location.lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Explore Questions by Location</h1>
          <p className="text-gray-600">
            Discover travel questions and answers from specific places across Sri Lanka
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "map"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <MapPin className="w-4 h-4" />
                Map View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
                List View
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Tag filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All topics</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Radius filter */}
              {viewMode === "list" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Within:</span>
                  <select
                    value={radius}
                    onChange={(e) => {
                      const newRadius = parseInt(e.target.value);
                      setRadius(newRadius);
                      if (userLocation) {
                        fetchNearbyQuestions(userLocation.lat, userLocation.lng);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10">10km</option>
                    <option value="25">25km</option>
                    <option value="50">50km</option>
                    <option value="100">100km</option>
                    <option value="200">200km</option>
                  </select>
                </div>
              )}

              {/* Find Near Me button */}
              {viewMode === "list" && (
                <button
                  onClick={handleFindNearMe}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Navigation2 className="w-4 h-4" />
                  Questions Near Me
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ height: "calc(100vh - 300px)" }}>
            <QuestionsMap
              center={mapCenter}
              zoom={mapZoom}
              tag={selectedTag}
              onQuestionSelect={(id) => router.push(`/questions/${id}`)}
            />
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {!userLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Navigation2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Find Questions Near You
                </h3>
                <p className="text-blue-700 mb-4">
                  Click "Questions Near Me" to discover travel questions and answers from your area
                </p>
                <button
                  onClick={handleFindNearMe}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Get Started
                </button>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <p className="text-gray-600">Finding questions near you...</p>
              </div>
            )}

            {!loading && userLocation && questions.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  No questions found within {radius}km of your location
                </p>
                <button
                  onClick={() => {
                    setRadius(radius * 2);
                    fetchNearbyQuestions(userLocation.lat, userLocation.lng);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Expand search radius
                </button>
              </div>
            )}

            {!loading && questions.length > 0 && (
              <>
                <div className="text-sm text-gray-600 mb-4 font-medium">
                  Found {questions.length} question{questions.length !== 1 ? "s" : ""} within {radius}km
                </div>
                <div className="space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Stats - Compact */}
                      <div className="hidden sm:flex flex-col gap-3 text-center min-w-[70px]">
                        <div>
                          <div className="text-lg font-bold text-gray-900">{question.score}</div>
                          <div className="text-xs text-gray-500">votes</div>
                        </div>
                        <div
                          className={`px-2 py-1.5 rounded ${
                            question.answer_count > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <div className="text-sm font-semibold">{question.answer_count}</div>
                          <div className="text-xs">answers</div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <a
                          href={`/questions/${question.id}`}
                          className="text-xl font-semibold text-blue-600 hover:text-blue-700 mb-2 block leading-tight"
                        >
                          {question.title}
                        </a>

                        {/* Mobile stats */}
                        <div className="flex sm:hidden gap-4 text-sm text-gray-600 mb-3">
                          <span>{question.score} votes</span>
                          <span className={question.answer_count > 0 ? "text-green-600 font-medium" : ""}>
                            {question.answer_count} answers
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{question.place_name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-green-600 font-medium">
                            {formatDistance(question.distance)}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags.map((tag) => (
                            <a
                              key={tag.id}
                              href={`/questions/tagged/${encodeURIComponent(tag.name)}`}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors"
                            >
                              {tag.name}
                            </a>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span>asked {formatDate(question.created_at)}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-medium text-gray-700">{question.display_name || question.username}</span>
                          <span className="text-gray-400">•</span>
                          <span>{question.views} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
