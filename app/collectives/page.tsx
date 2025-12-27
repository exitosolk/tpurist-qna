"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Users, MessageSquare, ChevronRight } from "lucide-react";

interface Collective {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  cover_image_url?: string;
  member_count: number;
  question_count: number;
  created_at: string;
}

export default function CollectivesPage() {
  const [collectives, setCollectives] = useState<Collective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollectives();
  }, []);

  const fetchCollectives = async () => {
    try {
      const response = await fetch("/api/collectives");
      const data = await response.json();
      setCollectives(data.collectives || []);
    } catch (error) {
      console.error("Error fetching collectives:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Travel Collectives</h1>
          <p className="text-lg text-gray-600">
            Join communities focused on specific aspects of traveling in Sri Lanka. 
            Connect with like-minded travelers, share experiences, and get expert advice.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading collectives...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collectives.map((collective) => (
              <Link
                key={collective.id}
                href={`/collectives/${collective.slug}`}
                className="block bg-white rounded-lg border hover:shadow-lg transition-all hover:border-blue-300"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {collective.icon_url ? (
                        <img 
                          src={collective.icon_url} 
                          alt={collective.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        collective.name.charAt(0)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {collective.name}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {collective.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{collective.member_count.toLocaleString()} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{collective.question_count.toLocaleString()} questions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && collectives.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-600">No collectives available yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
