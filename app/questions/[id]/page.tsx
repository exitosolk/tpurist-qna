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
import EditQuestionModal from "@/components/EditQuestionModal";
import EditAnswerModal from "@/components/EditAnswerModal";
import Tooltip from "@/components/Tooltip";
import Sidebar from "@/components/Sidebar";
import FlagButton from "@/components/FlagButton";
import UserBadge from "@/components/UserBadge";
import TagBadge from "@/components/TagBadge";
import AddToCollection from "@/components/AddToCollection";
import { Share2, Edit, Bookmark, Check, Clock, ChevronRight, Home, Bell, BellOff } from "lucide-react";

interface BadgeTierCounts {
  bronze: number;
  silver: number;
  gold: number;
}

interface User {
  username: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
  badgeCounts?: BadgeTierCounts;
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
  edited_at?: string;
  edit_count: number;
  tags: Array<{ id: number; name: string }>;
  is_closed: boolean;
  closed_at?: string;
  closed_by?: number;
  close_reason?: string;
  close_details?: string;
  auto_closed: boolean;
}

interface Answer extends User {
  id: number;
  user_id: number;
  body: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
  edited_at?: string;
  edit_count: number;
  experience_date?: string;
  comments?: Comment[];
}

interface UserTagBadge {
  userId: number;
  tagName: string;
  tier: 'bronze' | 'silver' | 'gold';
  isActive: boolean;
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
  const [experienceDate, setExperienceDate] = useState("");
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
  const [followingQuestion, setFollowingQuestion] = useState(false); // For notifications
  const [copiedQuestion, setCopiedQuestion] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editingAnswerModal, setEditingAnswerModal] = useState<number | null>(null);
  const [userReputation, setUserReputation] = useState(0);
  const [answerDraftId, setAnswerDraftId] = useState<number | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<"saved" | "saving" | "">("");
  const [userTagBadges, setUserTagBadges] = useState<UserTagBadge[]>([]);

  useEffect(() => {
    fetchQuestion();
    if (session?.user?.email) {
      fetchCurrentUser();
    }
  }, [params.id, session]);

  // Load answer draft
  useEffect(() => {
    if (question && session) {
      loadAnswerDraft();
    }
  }, [question, session]);

  // Auto-save answer draft every 5 seconds
  useEffect(() => {
    if (!session || !answerBody || !question) return;

    const timer = setTimeout(() => {
      saveAnswerDraft();
    }, 5000);

    return () => clearTimeout(timer);
  }, [answerBody, session, question]);

  const loadAnswerDraft = async () => {
    if (!question) return;
    
    try {
      const response = await fetch(`/api/drafts?type=answer&questionId=${question.id}`);
      const data = await response.json();
      
      if (data.drafts && data.drafts.length > 0) {
        const draft = data.drafts[0];
        setAnswerBody(draft.body || "");
        setAnswerDraftId(draft.id);
      }
    } catch (error) {
      console.error("Error loading answer draft:", error);
    }
  };

  const saveAnswerDraft = async () => {
    if (!answerBody || answerBody.trim().length === 0 || !question) return;

    setDraftSaveStatus("saving");
    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftType: "answer",
          bodyText: answerBody,
          questionId: question.id,
          draftId: answerDraftId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.draftId && !answerDraftId) {
          setAnswerDraftId(data.draftId);
        }
        setDraftSaveStatus("saved");
        setTimeout(() => setDraftSaveStatus(""), 2000);
      }
    } catch (error) {
      console.error("Error saving answer draft:", error);
    }
  };

  const deleteAnswerDraft = async () => {
    if (!answerDraftId) return;
    
    try {
      await fetch(`/api/drafts?id=${answerDraftId}`, {
        method: "DELETE",
      });
      setAnswerDraftId(null);
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

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
      fetchFollowingQuestionStatus();
    }
  }, [question?.id, session]);

  const fetchFollowingQuestionStatus = async () => {
    if (!question || !session) return;
    
    try {
      const response = await fetch(`/api/follows/check?questionIds=${question.id}`);
      const data = await response.json();
      
      if (response.ok && data.questionFollows) {
        setFollowingQuestion(!!data.questionFollows[question.id]);
      }
    } catch (error) {
      console.error("Error fetching question follow status:", error);
    }
  };

  // Update meta tags for SEO
  useEffect(() => {
    if (question) {
      // Update title
      document.title = `${question.title} | OneCeylon`;
      
      // Update or create meta tags
      const updateMetaTag = (name: string, content: string, isProperty = false) => {
        const attribute = isProperty ? 'property' : 'name';
        let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute(attribute, name);
          document.head.appendChild(tag);
        }
        tag.content = content;
      };

      // Extract plain text from markdown body (first 155 characters)
      const description = question.body.replace(/[#*`[\]()]/g, '').substring(0, 155) + '...';
      
      updateMetaTag('description', description);
      updateMetaTag('keywords', question.tags.map(t => t.name).join(', '));
      
      // Open Graph tags
      updateMetaTag('og:title', question.title, true);
      updateMetaTag('og:description', description, true);
      updateMetaTag('og:type', 'article', true);
      updateMetaTag('og:url', `https://oneceylon.space/questions/${question.id}`, true);
      
      // Twitter Card tags
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', question.title);
      updateMetaTag('twitter:description', description);
      
      // Article tags
      updateMetaTag('article:published_time', question.created_at, true);
      if (question.edited_at) {
        updateMetaTag('article:modified_time', question.edited_at, true);
      }
      updateMetaTag('article:author', question.display_name, true);
      question.tags.forEach(tag => {
        updateMetaTag('article:tag', tag.name, true);
      });
    }
  }, [question]);

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
        setUserReputation(data.profile.reputation || 0);
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
      setGeneralError("Comment must be at least 3 characters");
      setTimeout(() => setGeneralError(""), 5000);
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

      const data = await response.json();

      if (response.ok) {
        setCommentTexts({ ...commentTexts, [answerId]: "" });
        setShowCommentForm({ ...showCommentForm, [answerId]: false });
        fetchQuestion(); // Refresh comments
      } else if (data.verification_required) {
        setGeneralError("Please verify your email address before posting comments. Check your inbox for the verification link, or request a new one from your profile settings.");
        setTimeout(() => setGeneralError(""), 5000);
      } else {
        setGeneralError(data.error || "Failed to add comment");
        setTimeout(() => setGeneralError(""), 5000);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setGeneralError("An error occurred while adding your comment");
      setTimeout(() => setGeneralError(""), 5000);
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
    setEditingAnswerModal(answerId);
  };

  const handleSaveAnswer = async (answerId: number) => {
    if (!editAnswerBody.trim()) {
      setGeneralError("Answer body cannot be empty");
      setTimeout(() => setGeneralError(""), 5000);
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
        setGeneralError(data.error || "Failed to update answer");
        setTimeout(() => setGeneralError(""), 5000);
      }
    } catch (error) {
      console.error("Error updating answer:", error);
      setGeneralError("Failed to update answer");
      setTimeout(() => setGeneralError(""), 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditingAnswerId(null);
    setEditAnswerBody("");
  };

  const handleFollowAnswer = async (answerId: number) => {
    if (!session) {
      setGeneralError("Please log in to follow answers");
      setTimeout(() => setGeneralError(""), 5000);
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
        setGeneralError(data.error || "Failed to follow answer");
        setTimeout(() => setGeneralError(""), 5000);
      }
    } catch (error) {
      console.error("Error following answer:", error);
      setGeneralError("Failed to follow answer");
      setTimeout(() => setGeneralError(""), 5000);
    }
  };

  const handleFollowQuestion = async () => {
    if (!session) {
      setGeneralError("Please log in to bookmark questions");
      setTimeout(() => setGeneralError(""), 5000);
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
        setGeneralError(data.error || "Failed to bookmark question");
        setTimeout(() => setGeneralError(""), 5000);
      }
    } catch (error) {
      console.error("Error bookmarking question:", error);
      setGeneralError("Failed to bookmark question");
      setTimeout(() => setGeneralError(""), 5000);
    }
  };

  const handleFollowQuestionForNotifications = async () => {
    if (!session) {
      setGeneralError("Please log in to follow questions");
      setTimeout(() => setGeneralError(""), 5000);
      return;
    }

    if (!question) return;

    try {
      const response = await fetch("/api/follows/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setFollowingQuestion(data.isFollowing);
      } else {
        setGeneralError(data.error || "Failed to follow question");
        setTimeout(() => setGeneralError(""), 5000);
      }
    } catch (error) {
      console.error("Error following question:", error);
      setGeneralError("Failed to follow question");
      setTimeout(() => setGeneralError(""), 5000);
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
      setVoteError("Please log in to vote");
      setTimeout(() => setVoteError(""), 5000);
      return;
    }

    setVoteError("");

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
        if (data.verification_required) {
          setVoteError("Please verify your email address before voting. Check your inbox for the verification link, or request a new one from your profile settings.");
        } else {
          setVoteError(data.error || "Failed to vote");
        }
        setTimeout(() => setVoteError(""), 5000);
        return;
      }

      fetchQuestion();
    } catch (error) {
      console.error("Error voting:", error);
      setVoteError("An error occurred while voting");
      setTimeout(() => setVoteError(""), 5000);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setAnswerError("Please log in to answer");
      return;
    }

    setAnswerError("");
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
          experience_date: experienceDate || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnswerBody("");
        setExperienceDate("");
        setAnswerError("");
        await deleteAnswerDraft(); // Delete draft after successful submission
        fetchQuestion();
      } else if (data.verification_required) {
        setAnswerError("Please verify your email address before posting answers. Check your inbox for the verification link, or request a new one from your profile settings.");
      } else {
        setAnswerError(data.error || "Failed to post answer");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setAnswerError("An error occurred while submitting your answer");
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

  // Schema.org structured data for Q&A
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": question.title,
      "text": question.body,
      "answerCount": answers.length,
      "upvoteCount": question.score || 0,
      "dateCreated": question.created_at,
      "dateModified": question.edited_at || question.created_at,
      "author": {
        "@type": "Person",
        "name": question.display_name,
        "url": `https://oneceylon.space/users/${question.username}`
      },
      ...(answers.length > 0 && {
        "acceptedAnswer": answers.find(a => a.is_accepted) ? {
          "@type": "Answer",
          "text": answers.find(a => a.is_accepted)?.body,
          "upvoteCount": answers.find(a => a.is_accepted)?.score || 0,
          "dateCreated": answers.find(a => a.is_accepted)?.created_at,
          "author": {
            "@type": "Person",
            "name": answers.find(a => a.is_accepted)?.display_name,
            "url": `https://oneceylon.space/users/${answers.find(a => a.is_accepted)?.username}`
          }
        } : undefined,
        "suggestedAnswer": answers.filter(a => !a.is_accepted).slice(0, 5).map(answer => ({
          "@type": "Answer",
          "text": answer.body,
          "upvoteCount": answer.score || 0,
          "dateCreated": answer.created_at,
          "author": {
            "@type": "Person",
            "name": answer.display_name,
            "url": `https://oneceylon.space/users/${answer.username}`
          }
        }))
      })
    }
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://oneceylon.space"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Questions",
        "item": "https://oneceylon.space/questions"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": question.title,
        "item": `https://oneceylon.space/questions/${question.id}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema.org JSON-LD for Q&A */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Desktop Breadcrumbs */}
        <nav className="hidden md:flex items-center space-x-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 flex items-center">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/questions" className="hover:text-blue-600">
            Questions
          </Link>
          {question.tags.length > 0 ? (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link 
                href={`/questions/tagged/${question.tags[0].name}`}
                className="hover:text-blue-600"
              >
                {question.tags[0].name}
              </Link>
            </>
          ) : null}
        </nav>

        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          {question.tags.length > 0 && (
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
              {question.tags[0].name}
            </div>
          )}
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0 lg:order-1">
            {/* Vote Error Banner */}
            {voteError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="text-red-700 text-sm">{voteError}</p>
                  </div>
                  <button
                    onClick={() => setVoteError("")}
                    className="text-red-700 hover:text-red-900 ml-4"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* General Error Banner */}
            {generalError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="text-red-700 text-sm">{generalError}</p>
                  </div>
                  <button
                    onClick={() => setGeneralError("")}
                    className="text-red-700 hover:text-red-900 ml-4"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Question */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
              <div className="flex gap-4 text-sm text-gray-600 mb-6">
                <span>Asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                <span>Viewed {question.views} times</span>
              </div>

              {/* Closed Question Banner */}
              {question.is_closed && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-lg font-semibold text-yellow-800">
                        {question.auto_closed ? 'Automatically Closed' : 'Closed'}
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          {question.close_details || 'This question has been closed.'}
                        </p>
                        {question.closed_at && (
                          <p className="mt-1 text-xs text-yellow-600">
                            Closed {formatDistanceToNow(new Date(question.closed_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 text-sm">
                        <p className="text-yellow-800">
                          This question is not accepting new answers. You can still vote on existing answers or edit the question to improve it.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            {/* Mobile Author Info - Top */}
            <div className="md:hidden mb-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <UserBadge
                  username={question.username}
                  displayName={question.display_name}
                  avatarUrl={question.avatar_url}
                  reputation={question.reputation}
                  badgeCounts={question.badgeCounts}
                />
                <span className="text-xs text-gray-500">
                  asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="md:flex md:gap-4">
              {/* Desktop: Vote buttons on left (vertical) */}
              {currentUserId !== question.user_id && (
                <div className="hidden md:flex flex-col items-center gap-2">
                  <Tooltip content="This question shows research effort; it is useful and clear">
                    <button
                      onClick={() => handleVote("question", question.id, 1)}
                      className="p-2 hover:bg-gray-100 rounded"
                      disabled={!session}
                    >
                      ▲
                    </button>
                  </Tooltip>
                  <span className="text-2xl font-semibold">{question.score}</span>
                  <Tooltip content="This question does not show any research effort; it is unclear or not useful">
                    <button
                      onClick={() => handleVote("question", question.id, -1)}
                      className="p-2 hover:bg-gray-100 rounded"
                      disabled={!session}
                    >
                      ▼
                    </button>
                  </Tooltip>
                </div>
              )}
              {currentUserId === question.user_id && (
                <div className="hidden md:flex flex-col items-center gap-2">
                  <div className="p-2 text-gray-400">▲</div>
                  <span className="text-2xl font-semibold">{question.score}</span>
                  <div className="p-2 text-gray-400">▼</div>
                </div>
              )}

              <div className="flex-1">
                <MarkdownRenderer content={question.body} />

                {/* Mobile: Compact pill-style voting */}
                {currentUserId !== question.user_id && (
                  <div className="md:hidden my-4">
                    <div className="inline-flex items-center bg-gray-100 rounded-full overflow-hidden">
                      <button
                        onClick={() => handleVote("question", question.id, 1)}
                        className="px-4 py-2 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                        disabled={!session}
                      >
                        <span className="text-lg">▲</span>
                      </button>
                      <span className="px-3 font-semibold text-gray-800">{question.score}</span>
                      <button
                        onClick={() => handleVote("question", question.id, -1)}
                        className="px-4 py-2 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                        disabled={!session}
                      >
                        <span className="text-lg">▼</span>
                      </button>
                    </div>
                  </div>
                )}
                {currentUserId === question.user_id && (
                  <div className="md:hidden my-4">
                    <div className="inline-flex items-center bg-gray-100 rounded-full px-4 py-2">
                      <span className="text-gray-400 mr-2">▲</span>
                      <span className="font-semibold text-gray-800">{question.score}</span>
                      <span className="text-gray-400 ml-2">▼</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-6 flex-wrap">
                  {question.tags?.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/questions/tagged/${encodeURIComponent(tag.name)}`}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>

                {/* Question Action Buttons */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                  <Tooltip content="Share a link to this question">
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
                  </Tooltip>

                  <Tooltip content={followedQuestion ? "Remove this question from your bookmarks" : "Bookmark this question"}>
                    <button
                      onClick={handleFollowQuestion}
                      className={`flex items-center gap-1 ${
                        followedQuestion ? "text-blue-600" : "hover:text-blue-600"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${followedQuestion ? "fill-current" : ""}`} />
                      {followedQuestion ? "Bookmarked" : "Bookmark"}
                    </button>
                  </Tooltip>

                  <Tooltip content={followingQuestion ? "Stop receiving notifications for new answers" : "Get notified when new answers are posted"}>
                    <button
                      onClick={handleFollowQuestionForNotifications}
                      className={`flex items-center gap-1 ${
                        followingQuestion ? "text-purple-600" : "hover:text-purple-600"
                      }`}
                    >
                      {followingQuestion ? (
                        <><Bell className="w-4 h-4 fill-current" /> Following</>
                      ) : (
                        <><BellOff className="w-4 h-4" /> Follow</>
                      )}
                    </button>
                  </Tooltip>

                  {/* Add to Collection */}
                  {session && (
                    <AddToCollection questionId={question.id} />
                  )}

                  {/* Edit button for authors and high-rep users */}
                  {session && (currentUserId === question.user_id || userReputation >= 500) && (
                    <Tooltip content={currentUserId === question.user_id ? "Edit your question" : "Suggest edits to improve this question"}>
                      <button
                        onClick={() => setEditingQuestion(true)}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                    </Tooltip>
                  )}

                  {/* Flag button */}
                  <FlagButton 
                    contentType="question"
                    contentId={question.id}
                    authorId={question.user_id}
                    compact={true}
                  />
                </div>

                {/* Desktop Author Info - Bottom Right */}
                <div className="hidden md:flex justify-end mt-4">
                  <UserBadge
                    username={question.username}
                    displayName={question.display_name}
                    avatarUrl={question.avatar_url}
                    reputation={question.reputation}
                    badgeCounts={question.badgeCounts}
                  />
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">
                    <span className="text-gray-400">•</span>
                    {' '}asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                    {question.edit_count > 0 ? (
                      <>
                        <span className="text-gray-400 mx-1">•</span>
                        <Tooltip content="This question has been edited">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            edited
                          </span>
                        </Tooltip>
                      </>
                    ) : null}
                  </span>
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
            {answers.map((answer) => {
              // Check if accepted answer is older than 6 months
              const answerDate = new Date(answer.created_at);
              const sixMonthsAgo = new Date();
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
              const isStale = Boolean(answer.is_accepted) && answerDate < sixMonthsAgo;

              return (
                <div key={answer.id} id={`answer-${answer.id}`} className={`bg-white rounded-lg shadow-sm border p-4 md:p-6 scroll-mt-20 ${answer.is_accepted ? 'border-l-4 border-green-500' : ''}`}>
                  {/* Accepted Answer Badge - Mobile */}
                  {answer.is_accepted ? (
                    <div className="md:hidden mb-3 flex items-center gap-2 text-green-600 font-medium text-sm">
                      <span className="text-lg">✓</span>
                      <span>Accepted Answer</span>
                    </div>
                  ) : null}
                  
                  {/* Stale Data Warning Banner */}
                  {isStale ? (
                    <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Outdated Information:</strong> This answer is over 6 months old. Prices, schedules, or availability may have changed. Please verify current information before making travel plans.
                        </p>
                      </div>
                    </div>
                  </div>
                  ) : null}

                  <div className="md:flex md:gap-4">
                    {/* Desktop: Vote buttons on left (vertical) */}
                    {currentUserId !== answer.user_id && (
                      <div className="hidden md:flex flex-col items-center gap-2">
                        <Tooltip content="This answer is useful">
                          <button
                            onClick={() => handleVote("answer", answer.id, 1)}
                            className="p-2 hover:bg-gray-100 rounded"
                            disabled={!session}
                          >
                            ▲
                          </button>
                        </Tooltip>
                        <span className="text-2xl font-semibold">{answer.score}</span>
                          <Tooltip content="This answer is not useful">
                          <button
                            onClick={() => handleVote("answer", answer.id, -1)}
                            className="p-2 hover:bg-gray-100 rounded"
                            disabled={!session}
                          >
                            ▼
                          </button>
                        </Tooltip>
                        {answer.is_accepted ? (
                          <Tooltip content="The question owner accepted this as the best answer">
                            <div className="text-green-600 text-2xl">✓</div>
                          </Tooltip>
                        ) : null}
                      </div>
                    )}
                      {currentUserId === answer.user_id && (
                      <div className="hidden md:flex flex-col items-center gap-2">
                        <div className="p-2 text-gray-400">▲</div>
                        <span className="text-2xl font-semibold">{answer.score}</span>
                        <div className="p-2 text-gray-400">▼</div>
                        {answer.is_accepted ? (
                          <Tooltip content="The question owner accepted this as the best answer">
                            <div className="text-green-600 text-2xl">✓</div>
                          </Tooltip>
                        ) : null}
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
                        <>
                          <MarkdownRenderer content={answer.body} />
                          
                          {/* Mobile: Compact pill-style voting */}
                          {currentUserId !== answer.user_id && (
                            <div className="md:hidden my-4">
                              <div className="inline-flex items-center bg-gray-100 rounded-full overflow-hidden">
                                <button
                                  onClick={() => handleVote("answer", answer.id, 1)}
                                  className="px-4 py-2 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                                  disabled={!session}
                                >
                                  <span className="text-lg">▲</span>
                                </button>
                                <span className="px-3 font-semibold text-gray-800">{answer.score}</span>
                                <button
                                  onClick={() => handleVote("answer", answer.id, -1)}
                                  className="px-4 py-2 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                                  disabled={!session}
                                >
                                  <span className="text-lg">▼</span>
                                </button>
                              </div>
                            </div>
                          )}
                          {currentUserId === answer.user_id && (
                            <div className="md:hidden my-4">
                              <div className="inline-flex items-center bg-gray-100 rounded-full px-4 py-2">
                                <span className="text-gray-400 mr-2">▲</span>
                                <span className="font-semibold text-gray-800">{answer.score}</span>
                                <span className="text-gray-400 ml-2">▼</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-4 my-4 text-sm text-gray-600">
                        <Tooltip content="Share a link to this answer">
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
                        </Tooltip>

                        {currentUserId === answer.user_id && editingAnswerId !== answer.id && (
                          <Tooltip content="Edit this answer">
                            <button
                              onClick={() => handleEditAnswer(answer.id, answer.body)}
                              className="flex items-center gap-1 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                          </Tooltip>
                        )}

                        <Tooltip content={followedAnswers[answer.id] ? "Remove this answer from your bookmarks" : "Bookmark this answer to save it for later"}>
                          <button
                            onClick={() => handleFollowAnswer(answer.id)}
                            className={`flex items-center gap-1 ${
                              followedAnswers[answer.id] ? "text-blue-600" : "hover:text-blue-600"
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${followedAnswers[answer.id] ? "fill-current" : ""}`} />
                            {followedAnswers[answer.id] ? "Following" : "Follow"}
                          </button>
                        </Tooltip>

                        {question && currentUserId === question.user_id && !answer.is_accepted && (
                          <Tooltip content="Mark this answer as the accepted solution">
                            <button
                              onClick={() => handleAcceptAnswer(answer.id)}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                            >
                              ✓ Accept Answer
                            </button>
                          </Tooltip>
                        )}

                        {/* Flag button */}
                        <FlagButton 
                          contentType="answer"
                          contentId={answer.id}
                          authorId={answer.user_id}
                          compact={true}
                        />
                        
                        <span className="text-gray-300">|</span>
                        
                        <Tooltip content="Add a comment to this answer">
                          <button
                            onClick={() => setShowCommentForm({ ...showCommentForm, [answer.id]: !showCommentForm[answer.id] })}
                            className="hover:text-blue-600"
                          >
                            Add a comment
                          </button>
                        </Tooltip>
                      </div>

                      {/* Comments */}
                      {answer.comments && answer.comments.length > 0 ? (
                        <div className="border-t pt-4 space-y-3">
                          {answer.comments.map((comment) => (
                            <div key={comment.id} className="text-sm border-l-2 border-gray-200 pl-4 py-2">
                              <p className="text-gray-700 mb-1">{comment.text}</p>
                              <div className="flex items-center gap-2 flex-wrap text-gray-500">
                                <span>
                                  – <Link href={`/users/${comment.username}`} className="text-blue-600 hover:text-blue-800">
                                    {comment.display_name || comment.username}
                                  </Link>
                                  {' '}({comment.reputation}) {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                                <FlagButton 
                                  contentType="comment"
                                  contentId={comment.id}
                                  authorId={comment.user_id}
                                  compact={true}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

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

                      <div className="flex flex-col gap-2 mt-4">
                        {answer.experience_date && (
                          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-blue-50 border-l-4 border-emerald-500 px-3 py-2 rounded-r text-sm font-medium text-emerald-800 w-fit">
                            <span className="text-lg">💰</span>
                            <span>
                              Price info from: {new Date(answer.experience_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <UserBadge
                            username={answer.username}
                            displayName={answer.display_name}
                            avatarUrl={answer.avatar_url}
                            reputation={answer.reputation}
                            badgeCounts={answer.badgeCounts}
                          />
                          <span className="text-xs sm:text-sm text-gray-500">
                            <span className="text-gray-400">•</span>
                            {' '}answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Answer Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Answer Error Banner */}
          {answerError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="text-red-700 text-sm">{answerError}</p>
                </div>
                <button
                  onClick={() => setAnswerError("")}
                  className="text-red-700 hover:text-red-900 ml-4"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {session && !question.is_closed ? (
            <form onSubmit={handleSubmitAnswer}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Your Answer</h3>
                {draftSaveStatus && (
                  <span className="text-sm text-gray-500">
                    {draftSaveStatus === "saving" ? "Saving draft..." : "✓ Draft saved"}
                  </span>
                )}
              </div>
              <MarkdownEditor
                value={answerBody}
                onChange={setAnswerBody}
                placeholder="Share your knowledge and help other travelers. You can add images to illustrate your answer."
                minLength={30}
                userReputation={userReputation}
              />
              
              {/* Experience Date Field */}
              <div className="mt-4 border border-gray-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!experienceDate}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setExperienceDate("");
                      } else {
                        setExperienceDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      💰 Add pricing/cost information date
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      If your answer includes prices, costs, or fees, specify when you experienced this.
                    </p>
                  </div>
                </label>
                {experienceDate && (
                  <div className="mt-3 pl-7">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Date
                    </label>
                    <input
                      type="date"
                      value={experienceDate}
                      onChange={(e) => setExperienceDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Your Answer"}
              </button>
            </form>
          ) : question.is_closed ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-gray-600 font-medium mb-2">This question is closed</p>
              <p className="text-sm text-gray-500">New answers are not being accepted at this time.</p>
            </div>
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
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 lg:order-2">
            <div className="lg:sticky lg:top-8">
              <Sidebar currentTags={question?.tags.map(t => t.name) || []} />
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modals */}
      {editingQuestion && question && (
        <EditQuestionModal
          questionId={question.id}
          initialTitle={question.title}
          initialBody={question.body}
          initialTags={question.tags.map(t => t.name)}
          createdAt={question.created_at}
          userReputation={userReputation}
          onClose={() => setEditingQuestion(false)}
          onSuccess={() => {
            fetchQuestion();
            setEditingQuestion(false);
          }}
        />
      )}

      {editingAnswerModal !== null && (
        <EditAnswerModal
          answerId={editingAnswerModal}
          initialBody={answers.find(a => a.id === editingAnswerModal)?.body || ""}
          createdAt={answers.find(a => a.id === editingAnswerModal)?.created_at || ""}
          userReputation={userReputation}
          onClose={() => setEditingAnswerModal(null)}
          onSuccess={() => {
            fetchQuestion();
            setEditingAnswerModal(null);
          }}
        />
      )}
    </div>
  );
}
