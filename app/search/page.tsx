"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import { Search } from "lucide-react";

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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-gray-600">
            {loading ? (
              "Searching..."
            ) : (
              <>
                {questions.length} result{questions.length !== 1 ? "s" : ""} for "{query}"
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-gray-600">
              Try different keywords or browse all <Link href="/questions" className="text-blue-600 hover:underline">questions</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => {
              const tags = question.tags ? question.tags.split(",") : [];
              const questionUrl = question.slug 
                ? `/questions/${question.slug}` 
                : `/questions/${question.id}`;

              return (
                <div key={question.id} className="bg-white p-6 rounded-lg border hover:shadow-md transition">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-2 text-gray-600 min-w-[80px]">
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
                      <Link href={questionUrl} className="text-xl font-semibold text-blue-600 hover:underline mb-2 block">
                        {question.title}
                      </Link>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {question.body.substring(0, 200)}...
                      </p>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {tags.map((tag, idx) => (
                            <Link
                              key={idx}
                              href={`/tags/${tag}`}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <Link href={`/users/${question.username}`} className="hover:text-blue-600">
                          {question.display_name} ({question.reputation})
                        </Link>
                        <span>asked {formatDistanceToNow(new Date(question.created_at))} ago</span>
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
