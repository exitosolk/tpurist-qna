"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

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
  reputation: number;
  tags: Array<{ id: number; name: string }>;
  collectives?: Array<{ id: number; name: string; slug: string }>;
}

export default function TaggedQuestionsPage() {
  const params = useParams();
  const tag = params.tag as string;
  const decodedTag = decodeURIComponent(tag);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tagInfo, setTagInfo] = useState<{ count: number; followers?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetchQuestions();
  }, [sort, tag]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/questions?tag=${tag}&sort=${sort}`);
      const data = await response.json();
      setQuestions(data.questions || []);
      setTagInfo({ count: data.questions?.length || 0 });
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
        {/* Simplified Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">#{decodedTag}</h1>
            {/* Ask Question button - hidden on mobile (FAB exists) */}
            <Link
              href="/questions/ask"
              className="hidden lg:inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ask Question
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{tagInfo?.count || questions.length} question{(tagInfo?.count || questions.length) !== 1 ? 's' : ''}</span>
            {tagInfo?.followers && (
              <>
                <span>•</span>
                <span>{tagInfo.followers} followers</span>
              </>
            )}
          </div>
          <Link
            href="/questions"
            className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
          >
            ← All questions
          </Link>
        </div>

        {/* Filters - Pills Style */}
        <div className="mb-6 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-2">
            {["newest", "active", "votes", "unanswered"].map((sortOption) => (
              <button
                key={sortOption}
                onClick={() => setSort(sortOption)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  sort === sortOption
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
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
            <p className="text-gray-600 mb-4">No questions with tag "#{decodedTag}" yet.</p>
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
                {/* Collective badges - top of card */}
                {question.collectives && question.collectives.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {question.collectives.map((collective) => (
                      <Link
                        key={collective.id}
                        href={`/collectives/${collective.slug}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded text-xs font-medium hover:from-blue-700 hover:to-blue-800"
                      >
                        <span>🏛️</span>
                        {collective.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Question Title - Full Width */}
                <Link href={`/questions/${question.slug || question.id}`}>
                  <h3 className="text-lg md:text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                    {question.title}
                  </h3>
                </Link>

                {/* Snippet */}
                <p className="text-gray-600 mb-3 text-sm md:text-base line-clamp-2">
                  {question.body.substring(0, 200)}...
                </p>
                
                {/* Tags - Hide current tag */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {question.tags
                    ?.filter(qTag => qTag.name.toLowerCase() !== decodedTag.toLowerCase())
                    .map((qTag) => (
                      <Link
                        key={qTag.id}
                        href={`/questions/tagged/${encodeURIComponent(qTag.name)}`}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                      >
                        {qTag.name}
                      </Link>
                    ))}
                </div>

                {/* Stats Footer - Horizontal on Mobile */}
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-600 border-t pt-3">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{question.score}</span>
                    <span>vote{question.score !== 1 ? 's' : ''}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${question.answer_count > 0 ? 'text-green-600 font-medium' : ''}`}>
                    <span className="font-semibold">{question.answer_count}</span>
                    <span>answer{question.answer_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{question.views}</span>
                    <span>view{question.views !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="hidden md:block text-gray-400">•</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                      {(question.display_name || question.username).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-500">
                      <Link href={`/users/${question.username}`} className="text-blue-600 font-medium hover:text-blue-800">
                        {question.display_name || question.username}
                      </Link>
                      <span className="hidden md:inline"> asked</span> {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
