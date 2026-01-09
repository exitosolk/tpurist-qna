"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";

export default function HomePage() {
  const [locationStats, setLocationStats] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch real question counts
    fetch("/api/locations/stats")
      .then((res) => res.json())
      .then((data) => {
        const stats: Record<string, number> = {};
        data.locations?.forEach((loc: any) => {
          stats[loc.name] = loc.count;
        });
        setLocationStats(stats);
      })
      .catch((err) => console.error("Error fetching location stats:", err));
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OneCeylon",
    "url": "https://oneceylon.space",
    "description": "Get expert Sri Lanka travel advice. Ask questions about destinations, transportation, accommodations from travelers and locals who know best.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://oneceylon.space/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "OneCeylon",
      "url": "https://oneceylon.space"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section - Mobile Optimized */}
        <div className="text-center mb-12 relative">
          {/* Background Pattern - Subtle */}
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] pointer-events-none"></div>
          
          {/* Tagline - Above main heading */}
          <p className="text-sm md:text-base text-blue-600 font-medium mb-3 italic">Every traveler has a story. Share yours.</p>
          
          {/* Main H1 - Primary, Largest */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ask the Island
            <br />
            <span className="text-3xl md:text-5xl text-gray-700">Get Expert Sri Lanka Travel Advice</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with locals and experienced travelers. Discover hidden gems, plan your journey, and explore the Pearl of the Indian Ocean.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <a href="/questions/ask" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
              Ask a Question
            </a>
            <a href="/questions" className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-lg font-semibold transition-all">
              Browse Questions
            </a>
          </div>
        </div>

        {/* Why Choose OneCeylon - Bullet Points */}
        <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-blue-50 to-purple-50 p-6 md:p-8 rounded-xl shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-800">Why Choose OneCeylon?</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Connect with Locals</h3>
                <p className="text-gray-600 text-sm md:text-base">Get insider knowledge from Sri Lankans who know the island best</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Get Real-Time Advice</h3>
                <p className="text-gray-600 text-sm md:text-base">Ask questions and receive answers from experienced travelers within hours</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Plan with Confidence</h3>
                <p className="text-gray-600 text-sm md:text-base">Make informed decisions with honest reviews and practical travel tips</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm md:text-base text-gray-600 text-center">
            From Yala safaris to Ella train rides, from Colombo street food to pristine beaches – our community has you covered.
          </p>
        </div>

        {/* Value Proposition Cards - Mobile Optimized */}
        <div className="mb-12 overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 text-center">How OneCeylon Works</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
            <div className="bg-white p-8 rounded-xl shadow-sm border min-w-[280px] snap-start md:min-w-0">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-xl font-semibold mb-3">Ask Questions</h3>
              <p className="text-gray-600">
                Get answers from experienced travelers about destinations, activities, and travel tips in Sri Lanka.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border min-w-[280px] snap-start md:min-w-0">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-3">Share Knowledge</h3>
              <p className="text-gray-600">
                Help fellow travelers by sharing your experiences and local insights about Sri Lankan destinations.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border min-w-[280px] snap-start md:min-w-0">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-3">Build Reputation</h3>
              <p className="text-gray-600">
                Earn reputation points and badges by contributing valuable content to the community.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2 md:hidden">← Swipe to see more</p>
        </div>

        {/* Popular Topics - With Icons */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border">
          <h3 className="text-2xl font-bold mb-6 text-center">Explore Popular Topics</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { name: "Colombo", icon: "🏙️" },
              { name: "Kandy", icon: "🏛️" },
              { name: "Galle", icon: "🏰" },
              { name: "Ella", icon: "🚂" },
              { name: "Sigiriya", icon: "⛰️" },
              { name: "Beaches", icon: "🏖️" },
              { name: "Wildlife", icon: "🐘" },
              { name: "Food", icon: "🍛" },
              { name: "Culture", icon: "🕌" },
              { name: "Hiking", icon: "🥾" },
              { name: "Tea Country", icon: "🍵" },
              { name: "Budget Travel", icon: "💰" }
            ].map((tag) => (
              <a
                key={tag.name}
                href={`/questions/tagged/${encodeURIComponent(tag.name)}`}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm hover:shadow-md font-medium"
              >
                <span className="text-xl">{tag.icon}</span>
                <span>{tag.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Discover by Location - Enhanced */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 md:p-10 rounded-xl shadow-lg text-white mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-3xl font-bold mb-2">📍 Discover by Destination</h3>
              <p className="text-blue-100">Explore questions from Sri Lanka's most popular places</p>
            </div>
            <a 
              href="/questions/map" 
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm border border-white/30"
            >
              <span>View Map</span>
              <span>→</span>
            </a>
          </div>

          {/* Trending Locations - Horizontal Scroll */}
          <div className="mb-6">
            <h4 className="text-sm uppercase tracking-wide text-blue-200 mb-3 font-semibold">🔥 Trending Now</h4>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { name: "Ella", img: "🚂", location: "ella", color: "bg-gradient-to-br from-green-400 to-emerald-500" },
                { name: "Sigiriya", img: "⛰️", location: "sigiriya", color: "bg-gradient-to-br from-orange-400 to-red-500" },
                { name: "Kandy", img: "🏛️", location: "kandy", color: "bg-gradient-to-br from-purple-400 to-pink-500" },
                { name: "Galle", img: "🏰", location: "galle", color: "bg-gradient-to-br from-blue-400 to-cyan-500" },
                { name: "Colombo", img: "🏙️", location: "colombo", color: "bg-gradient-to-br from-gray-400 to-slate-500" },
                { name: "Mirissa", img: "🐋", location: "mirissa", color: "bg-gradient-to-br from-teal-400 to-blue-500" },
              ].map((location) => (
                <a
                  key={location.name}
                  href={`/questions/tagged/${encodeURIComponent(location.location)}`}
                  className="flex-shrink-0 group"
                >
                  <div className="w-32 h-40 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/40 transition-all p-3 flex flex-col items-center justify-between hover:scale-105 hover:shadow-xl">
                    <div className={`w-16 h-16 ${location.color} rounded-full flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                      {location.img}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white mb-1">{location.name}</p>
                      <p className="text-xs text-blue-200">
                        {locationStats[location.location] ? `${locationStats[location.location]}` : '...'} questions
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Category Groups */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Beaches */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏖️</span>
                <h4 className="font-semibold text-lg">Beaches</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Mirissa", "Unawatuna", "Arugam Bay", "Hikkaduwa"].map((beach) => (
                  <a
                    key={beach}
                    href={`/questions/tagged/${encodeURIComponent(beach.toLowerCase())}`}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-all border border-white/30"
                  >
                    {beach}
                  </a>
                ))}
              </div>
            </div>

            {/* Mountains & Hill Country */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⛰️</span>
                <h4 className="font-semibold text-lg">Mountains</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Ella", "Nuwara Eliya", "Haputale", "Adams Peak"].map((mountain) => (
                  <a
                    key={mountain}
                    href={`/questions/tagged/${encodeURIComponent(mountain.toLowerCase())}`}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-all border border-white/30"
                  >
                    {mountain}
                  </a>
                ))}
              </div>
            </div>

            {/* Cultural Sites */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏛️</span>
                <h4 className="font-semibold text-lg">Cultural</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Kandy", "Sigiriya", "Polonnaruwa", "Anuradhapura"].map((cultural) => (
                  <a
                    key={cultural}
                    href={`/questions/tagged/${encodeURIComponent(cultural.toLowerCase())}`}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-all border border-white/30"
                  >
                    {cultural}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* View All Link - Mobile */}
          <div className="mt-6 text-center">
            <a 
              href="/questions/map" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold shadow-lg"
            >
              <span>🗺️</span>
              <span>Explore All Locations on Map</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
