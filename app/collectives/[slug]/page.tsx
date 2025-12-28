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

      {/* Hero Header with Background Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-500 to-blue-700">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: collective.cover_image_url 
              ? `url('${collective.cover_image_url}')` 
              : `url('https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&h=400&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        
        {/* Back Link - Desktop Only */}
        <Link 
          href="/collectives" 
          className="hidden md:inline-flex absolute top-4 left-4 items-center gap-2 text-white/90 hover:text-white bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          All Communities
        </Link>
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{collective.name}</h1>
            <div className="flex items-center gap-4 text-sm text-white/90">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{collective.member_count.toLocaleString()} {collective.member_count === 1 ? 'member' : 'members'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>{collective.question_count.toLocaleString()} {collective.question_count === 1 ? 'question' : 'questions'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl pb-20 md:pb-8">

        {/* Compact Info Card - Desktop Only */}
        {collective.description && (
          <div className="hidden md:block bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">{collective.description}</p>
          </div>
        )}

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Questions</h2>
            {isMember && (
              <Link
                href="/questions/ask"
                className="hidden md:inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ask a Question
              </Link>
            )}
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <div className="text-6xl mb-4">❓</div>
              <p className="mb-4">No questions in this community yet.</p>
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
                  {/* Mobile: Horizontal stats at top */}
                  <div className="md:hidden flex items-center gap-4 text-xs text-gray-600 mb-2 pb-2 border-b">
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

                  <div className="md:flex md:gap-4">
                    {/* Desktop: Vertical stats on left */}
                    <div className="hidden md:flex flex-col gap-2 text-sm text-gray-600 min-w-24">
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
                        className="text-base md:text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2 block"
                      >
                        {question.title}
                      </Link>
                      <div className="text-xs md:text-sm text-gray-500">
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

        {/* Sticky Join Button - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-10">
          <button
            onClick={handleJoinToggle}
            disabled={joining}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              isMember
                ? "bg-gray-200 text-gray-700 active:bg-gray-300"
                : "bg-blue-600 text-white active:bg-blue-700"
            } disabled:opacity-50`}
          >
            {isMember ? (
              <>
                <UserMinus className="w-4 h-4" />
                {joining ? "Leaving..." : "Leave Community"}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {joining ? "Joining..." : "Join Community"}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
