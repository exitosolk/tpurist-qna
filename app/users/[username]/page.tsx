"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { TagBadgeCard } from "@/components/TagBadge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  id: number;
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
  question_slug?: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
}

interface Badge {
  id: number;
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
  description: string;
  icon: string;
  awarded_at: string;
}

interface TagBadge {
  id: number;
  tier: 'bronze' | 'silver' | 'gold';
  tagName: string;
  isActive: boolean;
  score: number;
  acceptedAnswers: number;
  earnedAt: string;
  lastActivity?: string;
  markedInactiveAt?: string;
}

interface ReputationHistory {
  id: number;
  change_amount: number;
  reason: string;
  reference_type: string;
  reference_id: number | null;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [tagBadges, setTagBadges] = useState<TagBadge[]>([]);
  const [reputationHistory, setReputationHistory] = useState<ReputationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "answers" | "badges" | "reputation">("questions");

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setQuestions(data.questions || []);
        setAnswers(data.answers || []);
        setBadges(data.badges || []);
        setReputationHistory(data.reputationHistory || []);
        
        // Fetch tag badges separately
        if (data.profile?.id) {
          const tagBadgesRes = await fetch(`/api/users/${data.profile.id}/tag-badges`);
          if (tagBadgesRes.ok) {
            const tagBadgesData = await tagBadgesRes.json();
            setTagBadges(tagBadgesData.badges || []);
          }
        }
      } else if (response.status === 404) {
        // User not found
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <p className="text-gray-600 mb-6">The user @{username} does not exist.</p>
          <Link
            href="/questions"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Questions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.display_name || profile.username}'s avatar`}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 flex-shrink-0">
                {profile.display_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-1">{profile.display_name || profile.username}</h1>
              <p className="text-gray-600 text-sm mb-2">
                @{profile.username} • Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              {profile.bio && <p className="text-gray-700 mb-3">{profile.bio}</p>}
              <div className="inline-flex items-center gap-1 text-sm">
                <span className="font-bold text-blue-600">{profile.reputation}</span>
                <span className="text-gray-600">reputation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{profile.reputation}</div>
              <div className="text-xs text-gray-600 mt-1">Reputation</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{questions.length}</div>
              <div className="text-xs text-gray-600 mt-1">Asked</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{answers.length}</div>
              <div className="text-xs text-gray-600 mt-1">Answers</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{badges.length}</div>
              <div className="text-xs text-gray-600 mt-1">Badges</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 -mx-4 px-4 overflow-x-auto">
          <nav className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "questions"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab("answers")}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "answers"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Answers ({answers.length})
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "badges"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Badges ({badges.length})
            </button>
            <button
              onClick={() => setActiveTab("reputation")}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "reputation"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "questions" ? (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600">This user hasn't asked any questions yet.</p>
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <Link href={`/questions/${question.slug || question.id}`}>
                    <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-3">
                      {question.title}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>{question.score} votes</span>
                    <span>{question.answer_count} answers</span>
                    <span>{question.views} views</span>
                    <span>{formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "answers" ? (
          <div className="space-y-4">
            {answers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600">This user hasn't posted any answers yet.</p>
              </div>
            ) : (
              answers.map((answer) => (
                <div key={answer.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <Link href={`/questions/${answer.question_slug || answer.question_id}#answer-${answer.id}`}>
                    <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800 mb-3">
                      {answer.question_title}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>{answer.score} votes</span>
                    {answer.is_accepted && (
                      <span className="text-green-600 font-medium">✓ Accepted</span>
                    )}
                    <span>{formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "badges" ? (
          <div className="space-y-6">
            {/* System Badges */}
            {badges.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Achievement Badges</h2>
                <div className="space-y-6">
                  {/* Gold Badges */}
                  {badges.filter(b => b.tier === 'gold').length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-yellow-500">●</span>
                        Gold Badges ({badges.filter(b => b.tier === 'gold').length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {badges.filter(b => b.tier === 'gold').map((badge) => (
                          <div key={badge.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <span className="text-2xl">{badge.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Earned {formatDistanceToNow(new Date(badge.awarded_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Silver Badges */}
                  {badges.filter(b => b.tier === 'silver').length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-gray-400">●</span>
                        Silver Badges ({badges.filter(b => b.tier === 'silver').length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {badges.filter(b => b.tier === 'silver').map((badge) => (
                          <div key={badge.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-2xl">{badge.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Earned {formatDistanceToNow(new Date(badge.awarded_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bronze Badges */}
                  {badges.filter(b => b.tier === 'bronze').length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-orange-600">●</span>
                        Bronze Badges ({badges.filter(b => b.tier === 'bronze').length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {badges.filter(b => b.tier === 'bronze').map((badge) => (
                          <div key={badge.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-2xl">{badge.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Earned {formatDistanceToNow(new Date(badge.awarded_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tag-Based Badges */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Tag Expertise Badges</h2>
              <p className="text-sm text-gray-600 mb-6">
                Expertise badges earned by contributing quality answers in specific topics.
              </p>

              {tagBadges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">🏆</div>
                  <p className="text-gray-600">No tag badges earned yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gold Tag Badges */}
                  {tagBadges.filter(b => b.tier === 'gold').length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-yellow-500">🥇</span>
                        Gold Badges ({tagBadges.filter(b => b.tier === 'gold' && b.isActive).length}
                        {tagBadges.filter(b => b.tier === 'gold' && !b.isActive).length > 0 && (
                          <span className="text-gray-500">+ {tagBadges.filter(b => b.tier === 'gold' && !b.isActive).length} inactive</span>
                        )})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tagBadges
                          .filter(b => b.tier === 'gold')
                          .map((badge) => (
                            <TagBadgeCard
                              key={badge.id}
                              tier={badge.tier}
                              tagName={badge.tagName}
                              isActive={badge.isActive}
                              score={badge.score}
                              acceptedAnswers={badge.acceptedAnswers}
                              earnedAt={new Date(badge.earnedAt)}
                              lastActivity={badge.lastActivity ? new Date(badge.lastActivity) : undefined}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Silver Tag Badges */}
                  {tagBadges.filter(b => b.tier === 'silver').length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-gray-400">🥈</span>
                        Silver Badges ({tagBadges.filter(b => b.tier === 'silver').length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tagBadges
                          .filter(b => b.tier === 'silver')
                          .map((badge) => (
                            <TagBadgeCard
                              key={badge.id}
                              tier={badge.tier}
                              tagName={badge.tagName}
                              isActive={badge.isActive}
                              score={badge.score}
                              acceptedAnswers={badge.acceptedAnswers}
                              earnedAt={new Date(badge.earnedAt)}
                              lastActivity={badge.lastActivity ? new Date(badge.lastActivity) : undefined}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Bronze Tag Badges */}
                  {tagBadges.filter(b => b.tier === 'bronze').length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-orange-600">🥉</span>
                        Bronze Badges ({tagBadges.filter(b => b.tier === 'bronze').length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tagBadges
                          .filter(b => b.tier === 'bronze')
                          .map((badge) => (
                            <TagBadgeCard
                              key={badge.id}
                              tier={badge.tier}
                              tagName={badge.tagName}
                              isActive={badge.isActive}
                              score={badge.score}
                              acceptedAnswers={badge.acceptedAnswers}
                              earnedAt={new Date(badge.earnedAt)}
                              lastActivity={badge.lastActivity ? new Date(badge.lastActivity) : undefined}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Show empty state if no badges at all */}
            {badges.length === 0 && tagBadges.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-600">This user hasn't earned any badges yet.</p>
              </div>
            )}
          </div>
        ) : (
          // Reputation History Tab
          <div className="bg-white rounded-lg shadow-sm border">
            {reputationHistory.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600">No reputation history available.</p>
              </div>
            ) : (
              <div className="divide-y">
                {reputationHistory.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${
                            entry.change_amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.change_amount > 0 ? '+' : ''}{entry.change_amount}
                          </span>
                          <span className="text-gray-700">{entry.reason}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.reference_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
