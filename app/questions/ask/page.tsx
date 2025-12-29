"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MarkdownEditor from "@/components/MarkdownEditor";

const POPULAR_TAGS = [
  "colombo", "kandy", "galle", "ella", "sigiriya", "beaches", "wildlife",
  "food", "culture", "hiking", "tea-country", "budget-travel", "transportation"
];

interface Collective {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export default function AskQuestionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Array<{name: string, count: number}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [collectives, setCollectives] = useState<Collective[]>([]);
  const [selectedCollectives, setSelectedCollectives] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmailVerified, setUserEmailVerified] = useState(true);
  const [userReputation, setUserReputation] = useState(0);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "">("");

  useEffect(() => {
    fetchCollectives();
    checkEmailVerification();
    loadDraft();
  }, []);

  // Auto-save draft every 5 seconds when content changes
  useEffect(() => {
    if (!session || (!title && !body)) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 5000);

    return () => clearTimeout(timer);
  }, [title, body, tags, session]);

  // Fetch tag suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (tagInput.length < 1) {
        setTagSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`/api/tags?search=${encodeURIComponent(tagInput)}&limit=8`);
        const data = await response.json();
        const filtered = data.tags.filter((tag: any) => !tags.includes(tag.name));
        setTagSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [tagInput, tags]);

  const loadDraft = async () => {
    try {
      const response = await fetch("/api/drafts?type=question");
      const data = await response.json();
      
      if (data.drafts && data.drafts.length > 0) {
        const draft = data.drafts[0];
        setTitle(draft.title || "");
        setBody(draft.body || "");
        setTags(draft.tags ? draft.tags.split(",") : []);
        setDraftId(draft.id);
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  const saveDraft = useCallback(async () => {
    if (!body || body.trim().length === 0) return;

    setAutoSaveStatus("saving");
    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftType: "question",
          title,
          bodyText: body,
          tags: tags.join(","),
          draftId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.draftId && !draftId) {
          setDraftId(data.draftId);
        }
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(""), 2000);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, [title, body, tags, draftId]);

  const deleteDraft = async () => {
    if (!draftId) return;
    
    try {
      await fetch(`/api/drafts?id=${draftId}`, {
        method: "DELETE",
      });
      setDraftId(null);
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  const fetchCollectives = async () => {
    try {
      const response = await fetch("/api/collectives");
      const data = await response.json();
      setCollectives(data.collectives || []);
    } catch (error) {
      console.error("Error fetching collectives:", error);
    }
  };

  const checkEmailVerification = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.profile) {
        setUserEmailVerified(data.profile.email_verified || false);
        setUserReputation(data.profile.reputation || 0);
      }
    } catch (error) {
      console.error("Error checking email verification:", error);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 5) {
      setTags([...tags, normalizedTag]);
      setTagInput("");
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleToggleCollective = (collectiveId: number) => {
    setSelectedCollectives(prev =>
      prev.includes(collectiveId)
        ? prev.filter(id => id !== collectiveId)
        : [...prev, collectiveId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (title.length < 15) {
      setError("Title must be at least 15 characters");
      return;
    }

    if (body.length < 30) {
      setError("Question body must be at least 30 characters");
      return;
    }

    if (tags.length === 0) {
      setError("Please add at least one tag");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          tags,
          collectives: selectedCollectives,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.verification_required) {
          setError("Please verify your email address before posting questions. Check your inbox for the verification link, or request a new one from your profile settings.");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      // Delete draft after successful submission
      await deleteDraft();

      // Redirect to the newly created question using slug
      router.push(`/questions/${data.slug || data.questionId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold">Ask a Travel Question</h2>
          {autoSaveStatus && (
            <span className="text-sm text-gray-500">
              {autoSaveStatus === "saving" ? "Saving draft..." : "✓ Draft saved"}
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-8">
          Share your travel question with the OneCeylon community
        </p>

        {/* Email Verification Banner */}
        {!userEmailVerified && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-blue-800 font-semibold mb-1">
                  📧 Verify your email to post questions
                </h3>
                <p className="text-blue-700 text-sm">
                  Please verify your email address to unlock full posting privileges and earn <strong>10 reputation points</strong>! Check your inbox or visit your{" "}
                  <Link href="/profile" className="underline font-medium">profile</Link> to resend the verification email.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Be specific and imagine you're asking a question to another traveler
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., What are the best beaches to visit in Galle?"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-2">{title.length} characters (minimum 15)</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are the details?
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Include all the information someone would need to answer your question. You can add images to help illustrate your question.
            </p>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Provide more context about your question..."
              minLength={30}
              userReputation={userReputation}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Add up to 5 tags to describe what your question is about
            </p>
            
            <div className="flex gap-2 mb-3 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="relative">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => tagInput.length > 0 && tagSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Type a tag and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={tags.length >= 5}
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={tags.length >= 5}
                >
                  Add
                </button>
              </div>

              {/* Tag Suggestions Dropdown */}
              {showSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {tagSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.name}
                      type="button"
                      onClick={() => handleAddTag(suggestion.name)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between group"
                    >
                      <span className="text-gray-900 group-hover:text-blue-600">{suggestion.name}</span>
                      <span className="text-xs text-gray-500">{suggestion.count} questions</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Popular tags:</span>
              {POPULAR_TAGS.filter(tag => !tags.includes(tag)).slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                  disabled={tags.length >= 5}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Collectives Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collectives (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Add your question to relevant travel collectives to reach the right audience
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {collectives.map((collective) => (
                <label
                  key={collective.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    selectedCollectives.includes(collective.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCollectives.includes(collective.id)}
                    onChange={() => handleToggleCollective(collective.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{collective.name}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{collective.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {selectedCollectives.length > 0 && (
              <p className="text-sm text-green-600 mt-3">
                ✓ {selectedCollectives.length} collective{selectedCollectives.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Question"}
            </button>
            <Link
              href="/questions"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
