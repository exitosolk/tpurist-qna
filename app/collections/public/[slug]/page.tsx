"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Globe, Users } from "lucide-react";

interface Collection {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  display_name: string;
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

export default function PublicCollectionPage() {
  const { data: session } = useSession();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const username = searchParams.get("username");

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username) {
      fetchCollection();
    } else {
      setError("Username is required to view this collection");
      setLoading(false);
    }
  }, [slug, username]);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/collections/public/${slug}?username=${username}`);
      const data = await response.json();

      if (response.ok) {
        setCollection(data.collection);
        setItems(data.items || []);
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
            <Link href="/questions" className="text-blue-600 hover:underline">
              Browse Questions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  Public Collection
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{collection.name}</h1>
              {collection.description && (
                <p className="text-gray-600 mb-3">{collection.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Link
                  href={`/users/${collection.username}`}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  <Users className="w-4 h-4" />
                  <span>by {collection.display_name || collection.username}</span>
                </Link>
                <span>{collection.item_count} {collection.item_count === 1 ? 'question' : 'questions'}</span>
                <span>Updated {formatDistanceToNow(new Date(collection.updated_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 This is a curated collection of questions shared by a community member. 
              Feel free to explore and bookmark questions that interest you!
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600">This collection is empty.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/questions/${item.question_slug || item.question_id}`}>
                      <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2">
                        {item.title}
                      </h3>
                    </Link>
                    {item.note && (
                      <div className="bg-gray-50 border-l-4 border-blue-400 p-3 mb-3">
                        <p className="text-sm text-gray-700 italic">
                          📌 {item.note}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>{item.score} votes</span>
                      <span>{item.answer_count} answers</span>
                      <span>{item.view_count} views</span>
                      <Link
                        href={`/users/${item.author_username}`}
                        className="hover:text-blue-600"
                      >
                        by {item.author_display_name || item.author_username}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Call to Action */}
        {items.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Want to create your own collection?</h3>
            <p className="text-gray-600 mb-4">
              Organize and share your favorite questions with the community.
            </p>
            {session ? (
              <Link
                href="/profile?tab=collections"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to My Collections
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign Up to Get Started
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
