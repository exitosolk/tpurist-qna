"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import UserBadge from "@/components/UserBadge";

interface BadgeTierCounts {
  bronze: number;
  silver: number;
  gold: number;
}

interface Question {
  id: number;
  slug?: string;
  title: string;
  body: string;
  score: number;
  views: number;
  answer_count: number;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
  badgeCounts?: BadgeTierCounts;
  tags: Array<{ id: number; name: string }>;
  collectives?: Array<{ id: number; name: string; slug: string }>;
}

function QuestionsContent() {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get("tag");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetchQuestions();
  }, [sort, tagFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (tagFilter) {
        params.append("tag", tagFilter);
      }
      const response = await fetch(`/api/questions?${params.toString()}`);
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0 lg:order-1">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">
              {tagFilter ? `Questions tagged [${tagFilter}]` : "All Questions"}
            </h2>
            {tagFilter && (
              <Link
                href="/questions"
                className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
              >
                ← View all questions
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {["newest", "active", "votes", "unanswered"].map((sortOption) => (
              <button
                key={sortOption}
                onClick={() => setSort(sortOption)}
                className={`px-4 py-2 rounded whitespace-nowrap ${
                  sort === sortOption
                    ? "bg-blue-600 text-white"
                    : "bg-white border hover:bg-gray-50"
                }`}
              >
                {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-600 mb-4">No questions yet. Be the first to ask!</p>
            <Link
              href="/questions/ask"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ask a Question
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow">
                {/* Mobile: Stats at top (horizontal) */}
                <div className="md:hidden flex items-center gap-4 text-xs text-gray-600 mb-3 pb-3 border-b">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{question.score}</span>
                    <span>votes</span>
                  </div>
                  <div className={`flex items-center gap-1 ${question.answer_count > 0 ? 'text-green-600' : ''}`}>
                    <span className="font-semibold">{question.answer_count}</span>
                    <span>answers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{question.views}</span>
                    <span>views</span>
                  </div>
                </div>

                <div className="flex gap-6">
                  {/* Desktop: Stats on left (vertical) */}
                  <div className="hidden md:flex flex-col gap-2 text-sm text-gray-600 min-w-24">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{question.score}</div>
                      <div>votes</div>
                    </div>
                    <div className={`text-center ${question.answer_count > 0 ? 'text-green-600' : ''}`}>
                      <div className="font-semibold text-lg">{question.answer_count}</div>
                      <div>answers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{question.views}</div>
                      <div>views</div>
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* Collective badges - subtle label above title */}
                    {question.collectives && question.collectives.length > 0 && (
                      <div className="flex gap-2 mb-1">
                        {question.collectives.map((collective) => (
                          <Link
                            key={collective.id}
                            href={`/collectives/${collective.slug}`}
                            className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600"
                          >
                            <span className="text-xs">🏛️</span>
                            <span className="font-medium">In: {collective.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    <Link href={`/questions/${question.slug || question.id}`}>
                      <h3 className="text-lg md:text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                        {question.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mb-3 line-clamp-2 md:line-clamp-3">
                      {question.body.substring(0, 250)}...
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2 flex-wrap">
                        {question.tags?.map((tag) => (
                          <Link
                            key={tag.id}
                            href={`/questions/tagged/${encodeURIComponent(tag.name)}`}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <UserBadge
                          username={question.username}
                          displayName={question.display_name}
                          avatarUrl={question.avatar_url}
                          reputation={question.reputation}
                          badgeCounts={question.badgeCounts}
                          size="small"
                        />
                        <span>
                          <span className="text-gray-400">•</span>
                          {' '}asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 lg:order-2">
            <div className="lg:sticky lg:top-8">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">Loading...</div>
      </div>
    }>
      <QuestionsContent />
    </Suspense>
  );
}
