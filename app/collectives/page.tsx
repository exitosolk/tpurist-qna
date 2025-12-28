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
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Travel Communities</h1>
          <p className="text-base md:text-lg text-gray-600">
            Connect with travelers and get expert advice in our curated communities.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading communities...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {collectives.map((collective) => {
              // Define default images for common collectives
              const defaultImages: { [key: string]: string } = {
                'colombo': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&h=600&fit=crop',
                'kandy': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
                'galle': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&h=600&fit=crop',
                'ella': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
              };
              
              const backgroundImage = collective.cover_image_url || defaultImages[collective.slug.toLowerCase()] || 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop';
              
              return (
                <Link
                  key={collective.id}
                  href={`/collectives/${collective.slug}`}
                  className="group block relative overflow-hidden rounded-lg h-48 md:h-56 hover:shadow-2xl transition-all"
                >
                  {/* Background Image with Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ 
                      backgroundImage: `url('${backgroundImage}')`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                  
                  {/* Content */}
                  <div className="relative h-full p-5 md:p-6 flex flex-col justify-end">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {collective.name}
                    </h3>

                    {/* Activity Stats */}
                    <div className="flex items-center gap-4 text-sm text-white/90">
                      <div className="flex items-center gap-1.5\">
                        <Users className="w-4 h-4" />
                        <span>{collective.member_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>{collective.question_count.toLocaleString()} questions</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Arrow Indicator */}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </Link>
              );
            })}
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
