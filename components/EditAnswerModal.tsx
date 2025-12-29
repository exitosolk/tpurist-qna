"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

interface EditAnswerModalProps {
  answerId: number;
  initialBody: string;
  createdAt: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAnswerModal({
  answerId,
  initialBody,
  createdAt,
  onClose,
  onSuccess,
}: EditAnswerModalProps) {
  const [body, setBody] = useState(initialBody);
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
      const response = await fetch(`/api/answers/${answerId}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          editReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update answer");
      }

      if (data.updateWarning) {
        alert(data.updateWarning);
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
          <h2 className="text-xl font-bold">Edit Answer</h2>
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
                This answer is older than 6 months
              </p>
              <p className="text-yellow-700">
                Instead of replacing content, consider adding an "**Update (December 2025):**" section at the bottom. This helps preserve the historical accuracy while providing current information.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer
            </label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Edit your answer..."
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
