"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface Question {
  id: number;
  title: string;
  body: string;
  slug: string;
  views: number;
  score: number;
  answer_count: number;
  created_at: string;
  username: string;
  display_name: string;
  reputation: number;
  tags: string;
}

// Helper function to highlight search terms
function highlightText(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 font-semibold">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    setSearchInput(query);
    if (query) {
      searchQuestions();
    } else {
      setQuestions([]);
      setLoading(false);
    }
  }, [query]);

  const searchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    router.push("/questions");
  };

  // Sort questions
  const sortedQuestions = [...questions].sort((a, b) => {
    switch (sortBy) {
      case "votes":
        return b.score - a.score;
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "relevance":
      default:
        return 0; // API already sorts by relevance
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {/* Prominent Search Bar - Always Visible */}
        <div className="mb-4 md:mb-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-12 pr-12 py-3 md:py-4 text-base md:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                autoFocus={!query}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Header with Sort */}
        {!loading && query && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-700">
              {questions.length} {questions.length === 1 ? 'result' : 'results'} for "{query}"
            </h2>
            
            {questions.length > 0 && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="votes">Most Votes</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Searching...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 md:py-16 bg-white rounded-lg border">
            <div className="text-6xl md:text-7xl mb-4">🔍</div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2">
              {query ? `No results found for "${query}"` : "Start searching"}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto px-4">
              {query 
                ? "Try different keywords, check your spelling, or browse all questions" 
                : "Enter a search term above to find questions"}
            </p>
            {query && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleClearSearch}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Clear Search
                </button>
                <Link
                  href="/questions"
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-medium"
                >
                  Browse All Questions
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedQuestions.map((question) => {
              const tags = question.tags ? question.tags.split(",") : [];
              const questionUrl = question.slug 
                ? `/questions/${question.slug}` 
                : `/questions/${question.id}`;

              return (
                <div key={question.id} className="bg-white p-4 md:p-6 rounded-lg border hover:shadow-md transition">
                  {/* Mobile: Horizontal stats at top */}
                  <div className="md:hidden flex items-center gap-4 text-xs text-gray-600 mb-3 pb-3 border-b">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{question.score}</span>
                      <span>votes</span>
                    </div>
                    <div className={`flex items-center gap-1 ${question.answer_count > 0 ? "text-green-600" : ""}`}>
                      <span className="font-semibold">{question.answer_count}</span>
                      <span>answers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{question.views}</span>
                      <span>views</span>
                    </div>
                  </div>

                  <div className="md:flex md:gap-4">
                    {/* Desktop: Vertical stats on left */}
                    <div className="hidden md:flex flex-col items-center gap-2 text-gray-600 min-w-[80px]">
                      <div className="text-center">
                        <div className="font-semibold">{question.score}</div>
                        <div className="text-sm">votes</div>
                      </div>
                      <div className={`text-center ${question.answer_count > 0 ? "text-green-600" : ""}`}>
                        <div className="font-semibold">{question.answer_count}</div>
                        <div className="text-sm">answers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{question.views}</div>
                        <div className="text-sm">views</div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <Link href={questionUrl} className="text-lg md:text-xl font-semibold text-blue-600 hover:underline mb-2 block">
                        {highlightText(question.title, query)}
                      </Link>
                      
                      <p className="text-sm md:text-base text-gray-600 mb-3 line-clamp-2">
                        {highlightText(question.body.substring(0, 250), query)}...
                      </p>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {tags.slice(0, 5).map((tag, idx) => (
                            <Link
                              key={idx}
                              href={`/tags/${tag}`}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm hover:bg-blue-200"
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-500">
                        <Link href={`/users/${question.username}`} className="hover:text-blue-600">
                          {question.display_name}
                        </Link>
                        <span className="text-gray-400">•</span>
                        <span>{question.reputation} rep</span>
                        <span className="text-gray-400">•</span>
                        <span>asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">Loading...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
