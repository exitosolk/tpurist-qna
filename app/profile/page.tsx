"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string;
  reputation: number;
  created_at: string;
  avatar_url?: string;
  bio?: string;
}

interface Question {
  id: number;
  slug?: string;
  title: string;
  score: number;
  answer_count: number;
  views: number;
  created_at: string;
}

interface Answer {
  id: number;
  question_id: number;
  question_title: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
}

interface Follow {
  followable_type: string;
  followable_id: number;
  question_title: string;
  question_slug?: string;
  question_id: number;
  followed_at: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "answers" | "bookmarks">("questions");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setQuestions(data.questions || []);
        setAnswers(data.answers || []);
      }

      // Fetch follows
      const followsResponse = await fetch("/api/follows");
      const followsData = await followsResponse.json();
      if (followsResponse.ok) {
        setFollows(followsData.follows || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
              {profile.display_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{profile.display_name || profile.username}</h1>
              <p className="text-gray-600 mb-3">@{profile.username}</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-2xl font-bold text-blue-600">{profile.reputation}</span>
                  <span className="text-gray-600 ml-2">reputation</span>
                </div>
                <div>
                  <span className="text-gray-600">Member for </span>
                  <span className="font-medium">{formatDistanceToNow(new Date(profile.created_at))}</span>
                </div>
              </div>
              {profile.bio && <p className="mt-4 text-gray-700">{profile.bio}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-3xl font-bold text-blue-600">{questions.length}</div>
            <div className="text-gray-600">Questions Asked</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-3xl font-bold text-green-600">{answers.length}</div>
            <div className="text-gray-600">Answers Posted</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab("questions")}
                className={`pb-4 px-1 border-b-2 font-medium ${
                  activeTab === "questions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Questions ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab("answers")}
                className={`pb-4 px-1 border-b-2 font-medium ${
                  activeTab === "answers"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Answers ({answers.length})
              </button>
              <button
                onClick={() => setActiveTab("bookmarks")}
                className={`pb-4 px-1 border-b-2 font-medium ${
                  activeTab === "bookmarks"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Bookmarks ({follows.length})
              </button>
              <button
                onClick={() => setActiveTab("bookmarks")}
                className={`pb-4 px-1 border-b-2 font-medium ${
                  activeTab === "bookmarks"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Bookmarks ({follows.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "questions" ? (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600 mb-4">You haven't asked any questions yet.</p>
                <Link
                  href="/questions/ask"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ask Your First Question
                </Link>
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <Link href={`/questions/${question.slug || question.id}`}>
                    <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                      {question.title}
                    </h3>
                  </Link>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>{question.score} votes</span>
                    <span>{question.answer_count} answers</span>
                    <span>{question.views} views</span>
                    <span>asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "bookmarks" ? (
          <div className="space-y-4">
            {follows.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600 mb-4">You haven't bookmarked any answers yet.</p>
                <Link
                  href="/questions"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Browse Questions
                </Link>
              </div>
            ) : (
              follows.map((follow, idx) => {
                const url = follow.followable_type === "answer" 
                  ? `/questions/${follow.question_slug || follow.question_id}#answer-${follow.followable_id}`
                  : `/questions/${follow.question_slug || follow.followable_id}`;
                
                return (
                  <div key={idx} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <Link href={url}>
                      <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800 mb-2">
                        {follow.followable_type === "answer" ? "Answer to: " : ""}
                        {follow.question_title}
                      </h3>
                    </Link>
                    <div className="flex gap-6 text-sm text-gray-600">
                      <span className="capitalize">{follow.followable_type}</span>
                      <span>bookmarked {formatDistanceToNow(new Date(follow.followed_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {answers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600 mb-4">You haven't posted any answers yet.</p>
                <Link
                  href="/questions"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Browse Questions
                </Link>
              </div>
            ) : (
              answers.map((answer) => (
                <div key={answer.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <Link href={`/questions/${answer.question_id}`}>
                    <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800 mb-2">
                      {answer.question_title}
                    </h3>
                  </Link>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>{answer.score} votes</span>
                    {answer.is_accepted && (
                      <span className="text-green-600 font-medium">✓ Accepted</span>
                    )}
                    <span>answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
