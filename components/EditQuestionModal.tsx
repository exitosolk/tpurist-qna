"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

interface EditQuestionModalProps {
  questionId: number;
  initialTitle: string;
  initialBody: string;
  initialTags: string[];
  createdAt: string;
  userReputation: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditQuestionModal({
  questionId,
  initialTitle,
  initialBody,
  initialTags,
  createdAt,
  userReputation,
  onClose,
  onSuccess,
}: EditQuestionModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [editReason, setEditReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showOldPostWarning, setShowOldPostWarning] = useState(false);

  useEffect(() => {
    // Check if post is older than 6 months
    const postAge = Date.now() - new Date(createdAt).getTime();
    const isOldPost = postAge > 6 * 30 * 24 * 60 * 60 * 1000;
    setShowOldPostWarning(isOldPost);
  }, [createdAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const response = await fetch(`/api/questions/${questionId}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          tags: tagArray,
          editReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update question");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Edit Question</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Old Post Warning */}
        {showOldPostWarning && (
          <div className="m-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900 mb-1">
                This post is older than 6 months
              </p>
              <p className="text-yellow-700">
                Consider adding an "**Update:**" section at the bottom instead
                of replacing the original content. This preserves the historical
                context.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={submitting}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body
            </label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Edit your question details..."
              userReputation={userReputation}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., colombo, transport, budget"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
          </div>

          {/* Edit Reason (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edit Summary (optional)
            </label>
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Briefly explain your changes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Help others understand what you changed
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
