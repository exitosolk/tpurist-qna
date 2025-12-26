"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import { extractIdFromSlug } from "@/lib/slug";
import Navbar from "@/components/Navbar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarkdownEditor from "@/components/MarkdownEditor";
import { Share2, Edit, Bookmark, Check } from "lucide-react";

interface User {
  username: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
}

interface Question extends User {
  id: number;
  user_id: number;
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
  user_id: number;
  body: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
  comments?: Comment[];
}

interface Comment {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  reputation: number;
  text: string;
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>({});
  const [showCommentForm, setShowCommentForm] = useState<{ [key: number]: boolean }>({});
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editAnswerBody, setEditAnswerBody] = useState("");
  const [copiedAnswerId, setCopiedAnswerId] = useState<number | null>(null);
  const [followedAnswers, setFollowedAnswers] = useState<Record<number, boolean>>({});
  const [followedQuestion, setFollowedQuestion] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState(false);

  useEffect(() => {
    fetchQuestion();
    if (session?.user?.email) {
      fetchCurrentUser();
    }
  }, [params.id, session]);

  // Scroll to answer if hash is present in URL
  useEffect(() => {
    if (answers.length > 0 && window.location.hash) {
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [answers]);

  // Fetch followed answers when answers load
  useEffect(() => {
    if (answers.length > 0 && session) {
      fetchFollowedAnswers();
    }
  }, [answers.length, session]);

  // Fetch followed question state
  useEffect(() => {
    if (question && session) {
      fetchFollowedQuestion();
    }
  }, [question?.id, session]);

  const fetchFollowedAnswers = async () => {
    try {
      const answerIds = answers.map(a => a.id).join(",");
      const response = await fetch(`/api/follows?type=answer&ids=${answerIds}`);
      const data = await response.json();
      
      const followedState: Record<number, boolean> = {};
      data.followedIds?.forEach((id: number) => {
        followedState[id] = true;
      });
      setFollowedAnswers(followedState);
    } catch (error) {
      console.error("Error fetching followed answers:", error);
    }
  };

  const fetchFollowedQuestion = async () => {
    if (!question) return;
    try {
      const response = await fetch(`/api/follows?type=question&ids=${question.id}`);
      const data = await response.json();
      setFollowedQuestion(data.followedIds?.includes(question.id) || false);
    } catch (error) {
      console.error("Error fetching followed question:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.profile) {
        setCurrentUserId(data.profile.id);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchQuestion = async () => {
    try {
      // Extract ID from slug if needed (e.g., "best-beaches-galle-123" -> 123)
      const questionId = extractIdFromSlug(params.id as string) || params.id;
      const response = await fetch(`/api/questions/${questionId}`);
      const data = await response.json();
      setQuestion(data.question);
      
      // Fetch comments for each answer
      const answersWithComments = await Promise.all(
        data.answers.map(async (answer: Answer) => {
          const commentsRes = await fetch(`/api/answers/${answer.id}/comments`);
          const commentsData = await commentsRes.json();
          return { ...answer, comments: commentsData.comments || [] };
        })
      );
      
      setAnswers(answersWithComments);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    try {
      const response = await fetch(`/api/answers/${answerId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        fetchQuestion(); // Refresh to show accepted status
      }
    } catch (error) {
      console.error("Error accepting answer:", error);
    }
  };

  const handleAddComment = async (answerId: number) => {
    const text = commentTexts[answerId]?.trim();
    if (!text || text.length < 3) {
      alert("Comment must be at least 3 characters");
      return;
    }

    try {
      const response = await fetch(`/api/answers/${answerId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        setCommentTexts({ ...commentTexts, [answerId]: "" });
        setShowCommentForm({ ...showCommentForm, [answerId]: false });
        fetchQuestion(); // Refresh comments
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleShareAnswer = async (answerId: number) => {
    const url = `${window.location.origin}${window.location.pathname}#answer-${answerId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAnswerId(answerId);
      setTimeout(() => setCopiedAnswerId(null), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      alert("Failed to copy link");
    }
  };

  const handleEditAnswer = (answerId: number, body: string) => {
    setEditingAnswerId(answerId);
    setEditAnswerBody(body);
  };

  const handleSaveAnswer = async (answerId: number) => {
    if (!editAnswerBody.trim()) {
      alert("Answer body cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/answers/${answerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: editAnswerBody }),
      });

      if (response.ok) {
        setEditingAnswerId(null);
        setEditAnswerBody("");
        fetchQuestion();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update answer");
      }
    } catch (error) {
      console.error("Error updating answer:", error);
      alert("Failed to update answer");
    }
  };

  const handleCancelEdit = () => {
    setEditingAnswerId(null);
    setEditAnswerBody("");
  };

  const handleFollowAnswer = async (answerId: number) => {
    if (!session) {
      alert("Please log in to follow answers");
      return;
    }

    try {
      const response = await fetch("/api/follows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followableType: "answer",
          followableId: answerId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setFollowedAnswers({ ...followedAnswers, [answerId]: data.isFollowing });
      } else {
        alert(data.error || "Failed to follow answer");
      }
    } catch (error) {
      console.error("Error following answer:", error);
      alert("Failed to follow answer");
    }
  };

  const handleFollowQuestion = async () => {
    if (!session) {
      alert("Please log in to bookmark questions");
      return;
    }

    if (!question) return;

    try {
      const response = await fetch("/api/follows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followableType: "question",
          followableId: question.id,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setFollowedQuestion(data.isFollowing);
      } else {
        alert(data.error || "Failed to bookmark question");
      }
    } catch (error) {
      console.error("Error bookmarking question:", error);
      alert("Failed to bookmark question");
    }
  };

  const handleShareQuestion = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedQuestion(true);
      setTimeout(() => setCopiedQuestion(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      alert("Failed to copy link");
    }
  };

  const handleVote = async (votableType: string, votableId: number, voteType: number) => {
    if (!session) {
      alert("Please log in to vote");
      return;
    }

    try {
      const response = await fetch("/api/votes", {
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

      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || "Failed to vote");
        return;
      }

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
      <Navbar />

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
              {/* Vote buttons - hide for own content */}
              {currentUserId !== question.user_id && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleVote("question", question.id, 1)}
                    className="p-2 hover:bg-gray-100 rounded"
                    disabled={!session}
                  >
                    ▲
                  </button>
                  <span className="text-2xl font-semibold">{question.score}</span>
                  <button
                    onClick={() => handleVote("question", question.id, -1)}
                    className="p-2 hover:bg-gray-100 rounded"
                    disabled={!session}
                  >
                    ▼
                  </button>
                </div>
              )}
              {currentUserId === question.user_id && (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 text-gray-400">▲</div>
                  <span className="text-2xl font-semibold">{question.score}</span>
                  <div className="p-2 text-gray-400">▼</div>
                </div>
              )}

              <div className="flex-1">
                <MarkdownRenderer content={question.body} />

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

                {/* Question Action Buttons */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                  <button
                    onClick={handleShareQuestion}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    {copiedQuestion ? (
                      <><Check className="w-4 h-4" /> Link copied!</>
                    ) : (
                      <><Share2 className="w-4 h-4" /> Share</>
                    )}
                  </button>

                  <button
                    onClick={handleFollowQuestion}
                    className={`flex items-center gap-1 ${
                      followedQuestion ? "text-blue-600" : "hover:text-blue-600"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${followedQuestion ? "fill-current" : ""}`} />
                    {followedQuestion ? "Bookmarked" : "Bookmark"}
                  </button>
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
              <div key={answer.id} id={`answer-${answer.id}`} className="bg-white rounded-lg shadow-sm border p-6 scroll-mt-20">
                <div className="flex gap-4">
                  {/* Vote buttons - hide for own content */}
                  {currentUserId !== answer.user_id && (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleVote("answer", answer.id, 1)}
                        className="p-2 hover:bg-gray-100 rounded"
                        disabled={!session}
                      >
                        ▲
                      </button>
                      <span className="text-2xl font-semibold">{answer.score}</span>
                      <button
                        onClick={() => handleVote("answer", answer.id, -1)}
                        className="p-2 hover:bg-gray-100 rounded"
                        disabled={!session}
                      >
                        ▼
                      </button>
                      {answer.is_accepted && (
                        <div className="text-green-600 text-2xl">✓</div>
                      )}
                    </div>
                  )}
                  {currentUserId === answer.user_id && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 text-gray-400">▲</div>
                      <span className="text-2xl font-semibold">{answer.score}</span>
                      <div className="p-2 text-gray-400">▼</div>
                      {answer.is_accepted && (
                        <div className="text-green-600 text-2xl">✓</div>
                      )}
                    </div>
                  )}

                  <div className="flex-1">
                    {editingAnswerId === answer.id ? (
                      <div className="mb-4">
                        <MarkdownEditor
                          value={editAnswerBody}
                          onChange={setEditAnswerBody}
                          placeholder="Edit your answer..."
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveAnswer(answer.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <MarkdownRenderer content={answer.body} />
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-4 my-4 text-sm text-gray-600">
                      <button
                        onClick={() => handleShareAnswer(answer.id)}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        {copiedAnswerId === answer.id ? (
                          <><Check className="w-4 h-4" /> Link copied!</>
                        ) : (
                          <><Share2 className="w-4 h-4" /> Share</>
                        )}
                      </button>

                      {currentUserId === answer.user_id && editingAnswerId !== answer.id && (
                        <button
                          onClick={() => handleEditAnswer(answer.id, answer.body)}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                      )}

                      <button
                        onClick={() => handleFollowAnswer(answer.id)}
                        className={`flex items-center gap-1 ${
                          followedAnswers[answer.id] ? "text-blue-600" : "hover:text-blue-600"
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${followedAnswers[answer.id] ? "fill-current" : ""}`} />
                        {followedAnswers[answer.id] ? "Following" : "Follow"}
                      </button>

                      {question && currentUserId === question.user_id && !answer.is_accepted && (
                        <button
                          onClick={() => handleAcceptAnswer(answer.id)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                        >
                          ✓ Accept Answer
                        </button>
                      )}
                      
                      <span className="text-gray-300">|</span>
                      
                      <button
                        onClick={() => setShowCommentForm({ ...showCommentForm, [answer.id]: !showCommentForm[answer.id] })}
                        className="hover:text-blue-600"
                      >
                        Add a comment
                      </button>
                    </div>

                    {/* Comments */}
                    {answer.comments && answer.comments.length > 0 && (
                      <div className="border-t pt-4 space-y-3">
                        {answer.comments.map((comment) => (
                          <div key={comment.id} className="text-sm border-l-2 border-gray-200 pl-4 py-2">
                            <p className="text-gray-700 mb-1">{comment.text}</p>
                            <span className="text-gray-500">
                              – <span className="text-blue-600">{comment.display_name || comment.username}</span>
                              {' '}({comment.reputation}) {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Form */}
                    {showCommentForm[answer.id] && session && (
                      <div className="mt-4 border-t pt-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentTexts[answer.id] || ""}
                            onChange={(e) => setCommentTexts({ ...commentTexts, [answer.id]: e.target.value })}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddComment(answer.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(answer.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setShowCommentForm({ ...showCommentForm, [answer.id]: false })}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
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
              <MarkdownEditor
                value={answerBody}
                onChange={setAnswerBody}
                placeholder="Share your knowledge and help other travelers. You can add images to illustrate your answer."
                minLength={30}
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
