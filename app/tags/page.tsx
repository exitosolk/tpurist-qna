"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Tag, Search, X, Hash, MapPin, Compass, Camera, Utensils, Plane, Waves, TreePine, Building2 } from "lucide-react";

interface TagData {
  name: string;
  count: number;
}

// Map tags to categories and icons for visual grouping
const getTagMetadata = (tagName: string) => {
  const tag = tagName.toLowerCase();
  
  // Destinations (cities/places)
  if (['colombo', 'kandy', 'galle', 'ella', 'sigiriya', 'negombo', 'jaffna', 'trincomalee', 'nuwara eliya', 'bentota', 'hikkaduwa', 'arugam bay', 'mirissa', 'unawatuna'].includes(tag)) {
    return { category: 'Destinations', icon: MapPin, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 group-hover:bg-blue-100' };
  }
  
  // Nature & Wildlife
  if (['wildlife', 'safari', 'nature', 'trekking', 'hiking', 'national park', 'yala', 'udawalawe', 'minneriya', 'horton plains'].includes(tag)) {
    return { category: 'Nature & Wildlife', icon: TreePine, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50 group-hover:bg-green-100' };
  }
  
  // Beach & Water
  if (['surfing', 'beach', 'diving', 'snorkeling', 'whale watching', 'water sports'].includes(tag)) {
    return { category: 'Beach & Water', icon: Waves, color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-50 group-hover:bg-cyan-100' };
  }
  
  // Food & Culture
  if (['food', 'cuisine', 'restaurant', 'street food', 'tea', 'temple', 'culture', 'festival', 'buddhism'].includes(tag)) {
    return { category: 'Food & Culture', icon: Utensils, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50 group-hover:bg-orange-100' };
  }
  
  // Travel Essentials
  if (['visa', 'transport', 'budget', 'accommodation', 'hotel', 'hostel', 'safety', 'scam', 'currency'].includes(tag)) {
    return { category: 'Travel Essentials', icon: Plane, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 group-hover:bg-purple-100' };
  }
  
  // Photography & Tours
  if (['photography', 'tour', 'guide', 'itinerary', 'day trip'].includes(tag)) {
    return { category: 'Photography & Tours', icon: Camera, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50 group-hover:bg-pink-100' };
  }
   and hide 0-count tags
  const filteredTags = (searchQuery
    ? tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tags
  ).filter((tag) => tag.count > 0); // Hide tags with 0 questions

  // Group tags by category
  const groupedTags = filteredTags.reduce((acc, tag) => {
    const { category } = getTagMetadata(tag.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, TagData[]>);

  // Sort categories
  const categoryOrder = ['Destinations', 'Nature & Wildlife', 'Beach & Water', 'Food & Culture', 'Travel Essentials', 'Photography & Tours', 'Other'];
  const sortedCategories = categoryOrder.filter(cat => groupedTags[cat]?.length > 0)ault function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tags?limit=100");
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  // Filter tags based on search query
  const filteredTags = searchQuery
    ? tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tags;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tags</h1>
          <p className="text-base md:text-lg text-gray-600">
            Browse topics and find questions by category.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {(searchInput || searchQuery) && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading tags...</p>
          </div>
        ) : (
          <>
            {/* Tags by Category */}
            {sortedCategories.map((category) => (
              <div key={category} className="mb-8">
                {/* Category Header */}
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  {category}
                  <span className="text-sm text-gray-500 font-normal">
                    ({groupedTags[category].length})
                  </span>
                </h2>

                {/* Tags Grid - 2 columns on mobile, more on larger screens */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {groupedTags[category].map((tag) => {
                    const { icon: Icon, color, bgColor } = getTagMetadata(tag.name);
                    return (
                      <Link
                        key={tag.name}
                        href={`/questions/tagged/${encodeURIComponent(tag.name)}`}
                        className="bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-blue-300 transition-all p-3 md:p-4 group"
                      >
                        <div className="flex flex-col gap-2">
                          <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center shrink-0 transition-colors`}>
                            <Icon className="w-5 h-5 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate mb-0.5 group-hover:text-blue-600 transition-colors">
                              {tag.name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500">
                              {tag.count} {tag.count === 1 ? "Q" : "Qs"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!loading && filteredTags.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  {searchQuery ? "No tags found matching your search." : "No tags available yet."}
                </p>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Stats Footer */}
            {!loading && filteredTags.length > 0 && (
              <div className="text-center text-sm text-gray-500 mt-8">
                Showing {filteredTags.length} {filteredTags.length === 1 ? "tag" : "tags"}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
