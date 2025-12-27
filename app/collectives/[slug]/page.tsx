"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";
import { Users, MessageSquare, UserPlus, UserMinus, ArrowLeft } from "lucide-react";

interface Collective {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  cover_image_url?: string;
  member_count: number;
  question_count: number;
  created_at: string;
}

interface Question {
  id: number;
  slug: string;
  title: string;
  score: number;
  views: number;
  answer_count: number;
  created_at: string;
  username: string;
  display_name: string;
  reputation: number;
}

export default function CollectivePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();
  const [collective, setCollective] = useState<Collective | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchCollective();
  }, [slug]);

  const fetchCollective = async () => {
    try {
      const response = await fetch(`/api/collectives/${slug}`);
      const data = await response.json();
      
      if (response.ok) {
        setCollective(data.collective);
        setQuestions(data.questions || []);
        setIsMember(data.isMember || false);
      }
    } catch (error) {
      console.error("Error fetching collective:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinToggle = async () => {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setJoining(true);
    try {
      const response = await fetch(`/api/collectives/${slug}/join`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setIsMember(data.isMember);
        // Update member count
        if (collective) {
          setCollective({
            ...collective,
            member_count: collective.member_count + (data.isMember ? 1 : -1),
          });
        }
      }
    } catch (error) {
      console.error("Error toggling membership:", error);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!collective) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Collective not found</h1>
          <Link href="/collectives" className="text-blue-600 hover:text-blue-800">
            ← Back to all collectives
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Cover Image */}
      {collective.cover_image_url && (
        <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-700">
          <img 
            src={collective.cover_image_url} 
            alt={collective.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Link */}
        <Link 
          href="/collectives" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Collectives
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {collective.icon_url ? (
                <img 
                  src={collective.icon_url} 
                  alt={collective.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                collective.name.charAt(0)
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{collective.name}</h1>
              <p className="text-gray-600 mb-4">{collective.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">{collective.member_count.toLocaleString()}</span>
                  <span>members</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">{collective.question_count.toLocaleString()}</span>
                  <span>questions</span>
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoinToggle}
                disabled={joining}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition ${
                  isMember
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-50`}
              >
                {isMember ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    {joining ? "Leaving..." : "Leave Collective"}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {joining ? "Joining..." : "Join Collective"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Questions</h2>
            {isMember && (
              <Link
                href="/questions/ask"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ask a Question
              </Link>
            )}
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="mb-4">No questions in this collective yet.</p>
              {isMember && (
                <Link
                  href="/questions/ask"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Be the first to ask!
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="border-b last:border-b-0 pb-4 last:pb-0"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 text-sm text-gray-600 min-w-24">
                      <div className="text-center">
                        <div className="font-semibold">{question.score}</div>
                        <div>votes</div>
                      </div>
                      <div className={`text-center ${question.answer_count > 0 ? 'text-green-600' : ''}`}>
                        <div className="font-semibold">{question.answer_count}</div>
                        <div>answers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{question.views}</div>
                        <div>views</div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <Link
                        href={`/questions/${question.slug || question.id}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2 block"
                      >
                        {question.title}
                      </Link>
                      <div className="text-sm text-gray-500">
                        asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })} by{" "}
                        <Link href={`/users/${question.username}`} className="text-blue-600 hover:text-blue-800">
                          {question.display_name || question.username}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
