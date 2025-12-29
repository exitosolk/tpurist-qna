"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Tag, Search, X, Hash } from "lucide-react";

interface TagData {
  name: string;
  count: number;
}

export default function TagsPage() {
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
            {/* Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {filteredTags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/questions/tagged/${encodeURIComponent(tag.name)}`}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-blue-300 transition-all p-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                      <Hash className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                        {tag.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {tag.count} {tag.count === 1 ? "question" : "questions"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {!loading && filteredTags.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchQuery ? "No tags found matching your search." : "No tags found."}
                </p>
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
