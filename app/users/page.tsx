"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { User, MapPin, Globe, Award, MessageSquare, HelpCircle, CheckCircle, Search, X } from "lucide-react";

interface UserData {
  id: number;
  username: string;
  display_name: string;
  reputation: number;
  created_at: string;
  bio?: string;
  location?: string;
  website?: string;
  email_verified: boolean;
  question_count: number;
  answer_count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery]);

  // Update meta tags for SEO
  useEffect(() => {
    document.title = 'Community Members - OneCeylon | Sri Lanka Travel Experts';
    
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    const description = 'Meet our community of Sri Lanka travel experts. Connect with experienced travelers, tour guides, and locals who share their knowledge about Ceylon.';
    
    updateMetaTag('description', description);
    updateMetaTag('keywords', 'Sri Lanka travel community, Ceylon experts, travel guides, local experts, tourism helpers');
    updateMetaTag('og:title', 'Community Members - OneCeylon', true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('twitter:title', 'Community Members - OneCeylon');
    updateMetaTag('twitter:description', description);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/users", window.location.origin);
      url.searchParams.set("page", page.toString());
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Users</h1>
          <p className="text-base md:text-lg text-gray-600">
            Connect with our community of travelers and experts.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search users by name or username..."
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
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : (
          <>
            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4 md:p-5 relative"
                >
                  {/* User Avatar & Info */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.display_name || user.username}
                        </h3>
                        {user.email_verified && (
                          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      <p className="text-xs text-gray-400 md:hidden mt-0.5">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                    {/* Member Since - Desktop Only, Top Right */}
                    <div className="hidden md:block text-xs text-gray-400 shrink-0">
                      {formatDate(user.created_at)}
                    </div>
                  </div>

                  {/* Bio - Only show if exists, with reduced margin */}
                  {user.bio && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {user.bio}
                    </p>
                  )}

                  {/* Location & Website - Compact */}
                  {(user.location || user.website) && (
                    <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-500 mb-2">
                      {user.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{user.location}</span>
                        </div>
                      )}
                      {user.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span className="truncate">Website</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats - Improved Layout with Labels */}
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <div className="flex items-center gap-3 text-xs md:text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">{user.reputation}</span>
                        <span className="text-gray-500 hidden sm:inline">rep</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{user.question_count}</span>
                        <span className="text-gray-500 hidden sm:inline">asked</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-3.5 h-3.5 transform scale-x-[-1]" />
                        <span>{user.answer_count}</span>
                        <span className="text-gray-500 hidden sm:inline">answered</span>
                      </div>
                    </div>
                    {/* View Profile Button - CTA */}
                    <Link
                      href={`/users/${user.username}`}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!loading && users.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchQuery ? "No users found matching your search." : "No users found."}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
