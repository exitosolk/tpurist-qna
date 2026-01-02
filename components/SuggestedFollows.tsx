"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface TagSuggestion {
  name: string;
  description: string;
  questionCount: number;
  reason: string;
  activityScore: number;
}

interface QuestionSuggestion {
  id: number;
  title: string;
  slug: string;
  viewCount: number;
  answerCount: number;
  tags: string[];
  author: {
    username: string;
    avatarUrl: string;
  };
  reason: string;
  matchingTagsCount: number;
}

export default function SuggestedFollows() {
  const { data: session } = useSession();
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [questionSuggestions, setQuestionSuggestions] = useState<QuestionSuggestion[]>([]);
  const [followingTags, setFollowingTags] = useState<Set<string>>(new Set());
  const [followingQuestions, setFollowingQuestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tags' | 'questions'>('tags');

  useEffect(() => {
    if (session?.user) {
      fetchSuggestions();
    }
  }, [session]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const [tagsRes, questionsRes] = await Promise.all([
        fetch('/api/follows/suggestions/tags?limit=5'),
        fetch('/api/follows/suggestions/questions?limit=5'),
      ]);

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTagSuggestions(tagsData.suggestions || []);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestionSuggestions(questionsData.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowTag = async (tagName: string) => {
    try {
      const response = await fetch('/api/follows/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isFollowing) {
          setFollowingTags(prev => new Set(prev).add(tagName));
          // Remove from suggestions
          setTagSuggestions(prev => prev.filter(t => t.name !== tagName));
        }
      }
    } catch (error) {
      console.error('Error following tag:', error);
    }
  };

  const handleFollowQuestion = async (questionId: number) => {
    try {
      const response = await fetch('/api/follows/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isFollowing) {
          setFollowingQuestions(prev => new Set(prev).add(questionId));
          // Remove from suggestions
          setQuestionSuggestions(prev => prev.filter(q => q.id !== questionId));
        }
      }
    } catch (error) {
      console.error('Error following question:', error);
    }
  };

  if (!session?.user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Suggested For You</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasSuggestions = tagSuggestions.length > 0 || questionSuggestions.length > 0;

  if (!hasSuggestions) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Suggested For You</h3>
        <p className="text-xs text-gray-500 mt-1">Based on your activity</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('tags')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'tags'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tags {tagSuggestions.length > 0 && `(${tagSuggestions.length})`}
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'questions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Questions {questionSuggestions.length > 0 && `(${questionSuggestions.length})`}
        </button>
      </div>

      <div className="p-4">
        {/* Tag Suggestions */}
        {activeTab === 'tags' && (
          <div className="space-y-3">
            {tagSuggestions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No tag suggestions available yet
              </p>
            ) : (
              tagSuggestions.map((tag) => (
                <div key={tag.name} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/tags/${tag.name}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        #{tag.name}
                      </Link>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {tag.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-500">
                          {tag.questionCount} question{tag.questionCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 italic">
                          {tag.reason}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowTag(tag.name)}
                      disabled={followingTags.has(tag.name)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {followingTags.has(tag.name) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Question Suggestions */}
        {activeTab === 'questions' && (
          <div className="space-y-3">
            {questionSuggestions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No question suggestions available yet
              </p>
            ) : (
              questionSuggestions.map((question) => (
                <div key={question.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/questions/${question.id}/${question.slug}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                      >
                        {question.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {question.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {question.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{question.tags.length - 2}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-500">
                          {question.answerCount} answer{question.answerCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 italic">
                          {question.reason}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowQuestion(question.id)}
                      disabled={followingQuestions.has(question.id)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      {followingQuestions.has(question.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
