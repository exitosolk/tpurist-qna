"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import { extractIdFromSlug } from "@/lib/slug";

interface User {
  username: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
}

interface Question extends User {
  id: number;
  title: string;
  body: string;
  score: number;
  views: number;
  answer_count: number;
  created_at: string;
  tags: Array<{ id: number; name: string }>;
}

interface Answer extends User {
  id: number;
  body: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
}

export default function QuestionDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answerBody, setAnswerBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, [params.id]);

  const fetchQuestion = async () => {
    try {
      // Extract ID from slug if needed (e.g., "best-beaches-galle-123" -> 123)
      const questionId = extractIdFromSlug(params.id as string) || params.id;
      const response = await fetch(`/api/questions/${questionId}`);
      const data = await response.json();
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (votableType: string, votableId: number, voteType: number) => {
    if (!session) {
      alert("Please log in to vote");
      return;
    }

    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          votableType,
          votableId,
          voteType,
        }),
      });

      fetchQuestion();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert("Please log in to answer");
      return;
    }

    setSubmitting(true);

    try {
      const questionId = extractIdFromSlug(params.id as string) || params.id;
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: answerBody,
        }),
      });

      if (response.ok) {
        setAnswerBody("");
        fetchQuestion();
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!question) {
    return <div className="min-h-screen flex items-center justify-center">Question not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-blue-600">OneCeylon</h1>
          </Link>
          <nav className="flex gap-4">
            <Link href="/questions" className="text-gray-700 hover:text-blue-600">
              Questions
            </Link>
            <Link href="/questions/ask" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Ask Question
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Question */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
          <div className="flex gap-4 text-sm text-gray-600 mb-6">
            <span>Asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
            <span>Viewed {question.views} times</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleVote("question", question.id, 1)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ▲
                </button>
                <span className="text-2xl font-semibold">{question.score}</span>
                <button
                  onClick={() => handleVote("question", question.id, -1)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ▼
                </button>
              </div>

              <div className="flex-1">
                <div className="prose max-w-none mb-6">
                  <p className="whitespace-pre-wrap">{question.body}</p>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
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

                <div className="flex justify-end">
                  <div className="bg-blue-50 rounded p-4">
                    <div className="text-sm text-gray-600 mb-1">
                      asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(question.display_name || question.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-blue-600">
                          {question.display_name || question.username}
                        </div>
                        <div className="text-sm text-gray-600">{question.reputation} reputation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>

          <div className="space-y-6">
            {answers.map((answer) => (
              <div key={answer.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleVote("answer", answer.id, 1)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      ▲
                    </button>
                    <span className="text-2xl font-semibold">{answer.score}</span>
                    <button
                      onClick={() => handleVote("answer", answer.id, -1)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      ▼
                    </button>
                    {answer.is_accepted && (
                      <div className="text-green-600 text-2xl">✓</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="prose max-w-none mb-6">
                      <p className="whitespace-pre-wrap">{answer.body}</p>
                    </div>

                    <div className="flex justify-end">
                      <div className={`rounded p-4 ${answer.is_accepted ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <div className="text-sm text-gray-600 mb-1">
                          answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {(answer.display_name || answer.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-blue-600">
                              {answer.display_name || answer.username}
                            </div>
                            <div className="text-sm text-gray-600">{answer.reputation} reputation</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-bold mb-4">Your Answer</h3>
          {session ? (
            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="Share your knowledge and help other travelers..."
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Your Answer"}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You must be logged in to post an answer.</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Log In to Answer
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
