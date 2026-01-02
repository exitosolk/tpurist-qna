"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FolderPlus, Check, X, Plus, Lock, Globe } from "lucide-react";
import Toast from "@/components/Toast";

interface Collection {
  id: number;
  name: string;
  item_count: number;
  is_public: boolean;
  has_question?: boolean;
}

interface AddToCollectionProps {
  questionId: number;
}

export default function AddToCollection({ questionId }: AddToCollectionProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionPublic, setNewCollectionPublic] = useState(false);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (showModal && session) {
      fetchCollections();
    }
  }, [showModal, session]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/collections");
      const data = await response.json();
      if (response.ok) {
        const collectionsData = data.collections || [];
        
        // Check which collections already have this question
        const collectionsWithStatus = await Promise.all(
          collectionsData.map(async (collection: Collection) => {
            try {
              const checkResponse = await fetch(`/api/collections/${collection.id}`);
              const checkData = await checkResponse.json();
              const hasQuestion = checkData.items?.some((item: any) => item.question_id === questionId);
              return { ...collection, has_question: hasQuestion };
            } catch {
              return { ...collection, has_question: false };
            }
          })
        );
        
        setCollections(collectionsWithStatus);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newCollectionName.trim()) return;

    setCreating(true);
    try {
      // Create collection
      const createResponse = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName.trim(), is_public: newCollectionPublic }),
      });

      if (createResponse.ok) {
        const { collection } = await createResponse.json();
        
        // Add question to new collection
        const addResponse = await fetch(`/api/collections/${collection.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_id: questionId }),
        });

        if (addResponse.ok) {
          setNewCollectionName("");
          setNewCollectionPublic(false);
          setShowModal(false);
          setToast({ message: "Question added to new collection!", type: 'success' });
        } else {
          setToast({ message: "Failed to add question to collection", type: 'error' });
        }
      } else {
        setToast({ message: "Failed to create collection", type: 'error' });
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      setToast({ message: "Failed to create collection", type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleAddToCollection = async (collectionId: number) => {
    setAddingTo(collectionId);
    try {
      const response = await fetch(`/api/collections/${collectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: "Question added to collection!", type: 'success' });
        setShowModal(false);
      } else {
        setToast({ message: data.error || "Failed to add to collection", type: 'error' });
      }
    } catch (error) {
      console.error("Error adding to collection:", error);
      setToast({ message: "Failed to add to collection", type: 'error' });
    } finally {
      setAddingTo(null);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
      >
        <FolderPlus className="w-5 h-5" />
        <span>Add to Collection</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add to Collection</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-center text-gray-600 py-8">Loading collections...</p>
              ) : (
                <>
                  {/* Create New Collection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Create New Collection
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="e.g., My Ella Trip"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              handleCreateAndAdd();
                            }
                          }}
                        />
                        <button
                          onClick={handleCreateAndAdd}
                          disabled={creating || !newCollectionName.trim()}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {creating ? "Creating..." : "Create"}
                        </button>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCollectionPublic}
                          onChange={(e) => setNewCollectionPublic(e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          {newCollectionPublic ? (
                            <><Globe className="w-4 h-4 text-green-600" /> Make public (anyone can view)</>
                          ) : (
                            <><Lock className="w-4 h-4 text-gray-600" /> Keep private (only you can view)</>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Existing Collections */}
                  {collections.length > 0 ? (
                    <>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Or add to existing collection:
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {collections.map((collection) => (
                          <button
                            key={collection.id}
                            onClick={() => !collection.has_question && handleAddToCollection(collection.id)}
                            disabled={addingTo === collection.id || collection.has_question}
                            className={`w-full text-left p-3 border rounded transition-colors ${
                              collection.has_question
                                ? 'border-green-200 bg-green-50 cursor-not-allowed'
                                : 'border-gray-200 hover:bg-gray-50 hover:border-purple-300 disabled:opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                                  {collection.name}
                                  {collection.has_question && (
                                    <Check className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {parseInt(collection.item_count as any) || 0} {parseInt(collection.item_count as any) === 1 ? 'question' : 'questions'}
                                  {collection.is_public && " • Public"}
                                  {collection.has_question && " • Already added"}
                                </div>
                              </div>
                              {addingTo === collection.id && (
                                <div className="ml-2 text-purple-600">
                                  <div className="animate-spin">⟳</div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FolderPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">You don't have any collections yet.</p>
                      <p className="text-xs">Create your first one above!</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-600">
                💡 Collections help you organize questions by topic, trip, or any category you choose.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
