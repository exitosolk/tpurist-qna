"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Globe, Lock, Edit2, Trash2, Share2, Check, Copy } from "lucide-react";
import Toast from "@/components/Toast";

interface Collection {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  display_name: string;
  is_owner: boolean;
  item_count: number;
}

interface CollectionItem {
  id: number;
  question_id: number;
  note: string | null;
  added_at: string;
  title: string;
  question_slug: string;
  score: number;
  answer_count: number;
  view_count: number;
  author_username: string;
  author_display_name: string;
}

export default function CollectionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const collectionSlug = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", is_public: false });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingItem, setDeletingItem] = useState<number | null>(null);

  useEffect(() => {
    fetchCollection();
  }, [collectionSlug]);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionSlug}`);
      const data = await response.json();

      if (response.ok) {
        setCollection(data.collection);
        setItems(data.items || []);
        setEditForm({
          name: data.collection.name,
          description: data.collection.description || "",
          is_public: data.collection.is_public,
        });
      } else {
        setError(data.error || "Failed to load collection");
      }
    } catch (error) {
      console.error("Error fetching collection:", error);
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      setToast({ message: "Collection name cannot be empty", type: 'error' });
      return;
    }

    if (!collection) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchCollection();
        setIsEditing(false);
        setToast({ message: "Collection updated successfully!", type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || "Failed to update collection", type: 'error' });
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      setToast({ message: "Failed to update collection", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setToast({ message: "Collection deleted successfully", type: 'success' });
        setTimeout(() => router.push("/profile?tab=collections"), 1000);
      } else {
        const data = await response.json();
        setToast({ message: data.error || "Failed to delete collection", type: 'error' });
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      setToast({ message: "Failed to delete collection", type: 'error' });
    }
    setConfirmDelete(false);
  };

  const handleRemoveItem = async (questionId: number) => {
    if (!collection) return;

    try {
      const response = await fetch(`/api/collections/${collection.id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId }),
      });

      if (response.ok) {
        setItems(items.filter((item) => item.question_id !== questionId));
        if (collection) {
          setCollection({ ...collection, item_count: collection.item_count - 1 });
        }
        setToast({ message: "Question removed from collection", type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || "Failed to remove question", type: 'error' });
      }
    } catch (error) {
      console.error("Error removing question:", error);
      setToast({ message: "Failed to remove question", type: 'error' });
    }
    setDeletingItem(null);
  };

  const handleShare = () => {
    if (!collection) return;

    const shareUrl = `${window.location.origin}/collections/public/${collection.slug}?username=${collection.username}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setToast({ message: "Share link copied to clipboard!", type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-red-600 mb-4">{error || "Collection not found"}</p>
            <Link href="/profile?tab=collections" className="text-blue-600 hover:underline">
              ← Back to Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile?tab=collections" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
            ← Back to Collections
          </Link>

          {isEditing ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
              <h2 className="text-xl font-bold mb-4">Edit Collection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Ella Trip"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Questions I saved for planning my trip to Ella..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={editForm.is_public}
                    onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700">
                    Make this collection public (anyone can view it)
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{collection.name}</h1>
                    {collection.is_public ? (
                      <span className="text-green-600" aria-label="Public collection">
                        <Globe className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="text-gray-400" aria-label="Private collection">
                        <Lock className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-gray-600 mb-3">{collection.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{collection.item_count} {collection.item_count === 1 ? 'question' : 'questions'}</span>
                    <span>Updated {formatDistanceToNow(new Date(collection.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
                {collection.is_owner && (
                  <div className="flex gap-2 ml-4">
                    {!!collection.is_public && (
                      <button
                        onClick={handleShare}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Share collection"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                      </button>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit collection"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete collection"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 mb-4">This collection is empty.</p>
              <p className="text-sm text-gray-500">
                {collection.is_owner
                  ? "Visit any question page and click the 'Add to Collection' button to save it here."
                  : "The owner hasn't added any questions yet."}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/questions/${item.question_slug || item.question_id}`}>
                      <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2">
                        {item.title}
                      </h3>
                    </Link>
                    {item.note && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        Note: {item.note}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>{item.score} votes</span>
                      <span>{item.answer_count} answers</span>
                      <span>{item.view_count} views</span>
                      <span>by {item.author_display_name || item.author_username}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Added {formatDistanceToNow(new Date(item.added_at), { addSuffix: true })}
                    </div>
                  </div>
                  {collection.is_owner && (
                    <button
                      onClick={() => setDeletingItem(item.question_id)}
                      className="text-gray-400 hover:text-red-600 p-2"
                      title="Remove from collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Delete Collection Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Collection?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this collection? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Item Confirmation Modal */}
      {deletingItem !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Remove Question?</h3>
            <p className="text-gray-600 mb-6">
              Remove this question from the collection?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveItem(deletingItem)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
