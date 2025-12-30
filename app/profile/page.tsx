"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BadgeList from "@/components/BadgeList";
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
  email_verified?: boolean;
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

interface Draft {
  id: number;
  draft_type: string;
  title?: string;
  body: string;
  tags?: string;
  question_id?: number;
  updated_at: string;
}

interface ReputationHistory {
  id: number;
  change_amount: number;
  reason: string;
  reference_type: string;
  reference_id: number | null;
  created_at: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [reputationHistory, setReputationHistory] = useState<ReputationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "answers" | "bookmarks" | "drafts" | "reputation" | "badges">("questions");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", bio: "", home_country: "" });
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
      checkBadges(); // Check for any eligible badges on profile load
    }
  }, [status]);

  const checkBadges = async () => {
    try {
      await fetch('/api/badges/check', { method: 'POST' });
    } catch (error) {
      console.error('Failed to check badges:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setQuestions(data.questions || []);
        setAnswers(data.answers || []);
        setEditForm({
          display_name: data.profile.display_name || "",
          bio: data.profile.bio || "",
        });
      }

      // Fetch follows
      const followsResponse = await fetch("/api/follows");
      const followsData = await followsResponse.json();
      if (followsResponse.ok) {
        setFollows(followsData.follows || []);
      }

      // Fetch drafts
      const draftsResponse = await fetch("/api/drafts");
      const draftsData = await draftsResponse.json();
      if (draftsResponse.ok) {
        setDrafts(draftsData.drafts || []);
      }

      // Fetch reputation history
      const reputationResponse = await fetch("/api/reputation-history");
      const reputationData = await reputationResponse.json();
      if (reputationResponse.ok) {
        setReputationHistory(reputationData.history || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setIsEditing(false);
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    setVerificationMessage("");
    try {
      const response = await fetch("/api/verify-email/send", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationMessage("Verification email sent! Check your inbox.");
      } else {
        setVerificationMessage(data.error || "Failed to send verification email");
      }
    } catch (error) {
      console.error("Error sending verification:", error);
      setVerificationMessage("Failed to send verification email");
    } finally {
      setSendingVerification(false);
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
        {/* Email Verification Banner */}
        {profile && !profile.email_verified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-yellow-800 font-semibold mb-1">
                  Verify your email address
                </h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Verify your email to unlock all features and earn <strong>10 reputation points</strong>!
                </p>
                <button
                  onClick={handleSendVerification}
                  disabled={sendingVerification}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
                >
                  {sendingVerification ? "Sending..." : "Send Verification Email"}
                </button>
                {verificationMessage && (
                  <p className={`mt-2 text-sm ${verificationMessage.includes("sent") ? "text-green-700" : "text-red-700"}`}>
                    {verificationMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6">
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-100 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold text-blue-600 flex-shrink-0">
                {profile.display_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      maxLength={1000}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Country
                    </label>
                    <input
                      type="text"
                      value={editForm.home_country}
                      onChange={(e) => setEditForm({ ...editForm, home_country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={100}
                      placeholder="e.g., United States, Sri Lanka, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editForm.bio.length}/1000 characters
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          display_name: profile.display_name || "",
                          bio: profile.bio || "",
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{profile.display_name || profile.username}</h1>
                  <p className="text-sm text-gray-600 mb-2">@{profile.username}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600 mb-3">
                    <span className="font-semibold text-blue-600">{profile.reputation} reputation</span>
                    <span className="text-gray-400">•</span>
                    <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
                    {profile.home_country && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>📍 {profile.home_country}</span>
                      </>
                    )}
                  </div>
                  {profile.bio && <p className="text-sm md:text-base text-gray-700 mb-3">{profile.bio}</p>}
                  <button
                    onClick={() => {
                      setEditForm({
                        display_name: profile?.display_name || "",
                        bio: profile?.bio || "",
                        home_country: profile?.home_country || "",
                      });
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm"
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats - Desktop Only */}
        <div className="hidden md:grid grid-cols-2 gap-4 mb-6">
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
        <div className="mb-6 sticky top-0 bg-gray-50 z-10 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="border-b bg-white md:bg-transparent">
            <nav className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("questions")}
                className={`pb-4 px-1 border-b-2 font-medium whitespace-nowrap text-sm md:text-base ${
                  activeTab === "questions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Questions ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab("answers")}
                className={`pb-4 px-1 border-b-2 font-medium whitespace-nowrap text-sm md:text-base ${
                  activeTab === "answers"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Answers ({answers.length})
              </button>
              <button
                onClick={() => setActiveTab("bookmarks")}
                className={`pb-4 px-1 border-b-2 font-medium whitespace-nowrap text-sm md:text-base ${
                  activeTab === "bookmarks"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Bookmarks ({follows.length})
              </button>
              <button
                onClick={() => setActiveTab("drafts")}
                className={`pb-4 px-1 border-b-2 font-medium whitespace-nowrap text-sm md:text-base ${
                  activeTab === "drafts"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Drafts ({drafts.length})
              </button>
              <button
                onClick={() => setActiveTab("reputation")}
                className={`pb-4 px-1 border-b-2 font-medium whitespace-nowrap text-sm md:text-base ${
                  activeTab === "reputation"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="md:hidden">Activity ({profile?.reputation || 0})</span>
                <span className="hidden md:inline">Reputation ({profile?.reputation || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab("badges")}
                className={`pb-4 px-1 border-b-2 font-medium whitespace-nowrap text-sm md:text-base ${
                  activeTab === "badges"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Badges
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "questions" ? (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12 text-center">
                <div className="text-6xl mb-4">❓</div>
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
                <div key={question.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow">
                  <Link href={`/questions/${question.slug || question.id}`}>
                    <h3 className="text-lg md:text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                      {question.title}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-gray-600">
                    <span>{question.score} votes</span>
                    <span>{question.answer_count} answers</span>
                    <span>{question.views} views</span>
                    <span>asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "answers" ? (
          <div className="space-y-4">
            {answers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12 text-center">
                <div className="text-6xl mb-4">💬</div>
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
                <div key={answer.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow">
                  <Link href={`/questions/${answer.question_id}`}>
                    <h3 className="text-base md:text-lg font-medium text-blue-600 hover:text-blue-800 mb-2">
                      {answer.question_title}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-gray-600">
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
        ) : activeTab === "bookmarks" ? (
          <div className="space-y-4">
            {follows.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12 text-center">
                <div className="text-6xl mb-4">🔖</div>
                <p className="text-gray-600 mb-4">You haven't bookmarked anything yet.</p>
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
                  <div key={idx} className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow">
                    <Link href={url}>
                      <h3 className="text-base md:text-lg font-medium text-blue-600 hover:text-blue-800 mb-2">
                        {follow.followable_type === "answer" ? "Answer to:" : ""}
                        {follow.question_title}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-gray-600">
                      <span className="capitalize">{follow.followable_type}</span>
                      <span>bookmarked {formatDistanceToNow(new Date(follow.followed_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : activeTab === "drafts" ? (
          <div className="space-y-4">
            {drafts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600 mb-4">No drafts saved yet.</p>
                <p className="text-sm text-gray-500">Your question and answer drafts are automatically saved as you type.</p>
              </div>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          draft.draft_type === "question" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          {draft.draft_type === "question" ? "Question Draft" : "Answer Draft"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Last saved {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      {draft.title && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {draft.title}
                        </h3>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {draft.body.substring(0, 200)}...
                      </p>
                      {draft.tags && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {draft.tags.split(",").map((tag, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={draft.draft_type === "question" ? "/questions/ask" : draft.question_id ? `/questions/${draft.question_id}` : "/questions"}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                      >
                        Continue
                      </Link>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this draft?")) {
                            try {
                              await fetch(`/api/drafts?id=${draft.id}`, { method: "DELETE" });
                              setDrafts(drafts.filter(d => d.id !== draft.id));
                            } catch (error) {
                              console.error("Error deleting draft:", error);
                            }
                          }
                        }}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "reputation" ? (
          <div className="space-y-4">
            {reputationHistory.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600">No reputation history yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold">Reputation History</h3>
                  <p className="text-sm text-gray-600 mt-1">Total reputation: {profile?.reputation || 0} points</p>
                </div>
                <div className="divide-y">
                  {reputationHistory.map((entry) => (
                    <div key={entry.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-semibold ${entry.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.change_amount > 0 ? '+' : ''}{entry.change_amount}
                          </span>
                          <span className="text-gray-700">{entry.reason}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                            {entry.reference_type.replace('_', ' ')}
                          </span>
                          <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "badges" ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <BadgeList showProgress={true} compact={false} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
