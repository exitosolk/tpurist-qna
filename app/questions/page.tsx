"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

export default function QuestionsPage() {
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

        <div className="mb-6 flex gap-2">
          {["newest", "active", "votes", "unanswered"].map((sortOption) => (
            <button
              key={sortOption}
              onClick={() => setSort(sortOption)}
              className={`px-4 py-2 rounded ${
                sort === sortOption
                  ? "bg-blue-600 text-white"
                  : "bg-white border hover:bg-gray-50"
              }`}
            >
              {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
            </button>
          ))}
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
              <div key={question.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-6">
                  <div className="flex flex-col gap-2 text-sm text-gray-600 min-w-24">
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
                    <Link href={`/questions/${question.slug || question.id}`}>
                      <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                        {question.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {question.body.substring(0, 200)}...
                    </p>
                    
                    {/* Collective badges */}
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
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 flex-wrap">
                        {question.tags?.map((tag) => (
                          <Link
                            key={tag.id}
                            href={`/questions?tag=${tag.name}`}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100"
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })} by{" "}
                        <Link href={`/users/${question.username}`} className="text-blue-600 font-medium hover:text-blue-800">
                          {question.display_name || question.username}
                        </Link>
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
