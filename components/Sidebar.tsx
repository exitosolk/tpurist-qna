"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Car, AlertTriangle } from "lucide-react";

interface Tag {
  name: string;
  count: number;
}

interface Question {
  id: number;
  slug?: string;
  title: string;
  score: number;
  answer_count: number;
  created_at: string;
  tags: string;
  username: string;
}

interface TukTukRoute {
  start_location: string;
  end_location: string;
  avg_price: number;
  report_count: number;
}

interface ScamReport {
  id: number;
  tag: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  upvotes: number;
  verified: boolean;
  reported_by_username: string;
}

interface SidebarProps {
  currentTags?: string[];
}

export default function Sidebar({ currentTags = [] }: SidebarProps) {
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<Question[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [tukTukRoutes, setTukTukRoutes] = useState<TukTukRoute[]>([]);
  const [scamReports, setScamReports] = useState<ScamReport[]>([]);

  useEffect(() => {
    fetchPopularTags();
    fetchUnansweredQuestions();
    fetchRelatedQuestions();
    fetchTukTukRoutes();
  }, []);

  useEffect(() => {
    if (currentTags.length > 0) {
      fetchScamReports();
    }
  }, [currentTags.join(',')]);  // Use join to prevent array reference changes

  const fetchPopularTags = async () => {
    try {
      const response = await fetch("/api/tags?limit=5");
      const data = await response.json();
      setPopularTags(data.tags || []);
    } catch (error) {
      console.error("Error fetching popular tags:", error);
    }
  };

  const fetchUnansweredQuestions = async () => {
    try {
      const response = await fetch("/api/questions?filter=unanswered&limit=1&sort=votes");
      const data = await response.json();
      const questions = data.questions || [];
      
      // Format tags if they come as JSON array
      const formattedQuestions = questions.map((q: any) => ({
        ...q,
        tags: typeof q.tags === 'string' 
          ? q.tags 
          : Array.isArray(q.tags) 
            ? q.tags.map((t: any) => t.name).join(',') 
            : ''
      }));
      
      setUnansweredQuestions(formattedQuestions);
    } catch (error) {
      console.error("Error fetching unanswered questions:", error);
    }
  };

  const fetchRelatedQuestions = async () => {
    try {
      const response = await fetch("/api/questions?limit=8&sort=votes");
      const data = await response.json();
      setRelatedQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching related questions:", error);
    }
  };

  const fetchTukTukRoutes = async () => {
    try {
      const response = await fetch("/api/tuktuk-prices?limit=5");
      const data = await response.json();
      setTukTukRoutes(data.popular_routes || []);
    } catch (error) {
      console.error("Error fetching tuktuk routes:", error);
    }
  };

  const fetchScamReports = async () => {
    try {
      // Fetch scam reports for the first/most relevant tag
      const tag = currentTags[0];
      if (!tag) return;
      
      const response = await fetch(`/api/scam-reports?tag=${encodeURIComponent(tag)}&limit=3`);
      const data = await response.json();
      setScamReports(data.scams || []);
    } catch (error) {
      console.error("Error fetching scam reports:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Popular Tags */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="flex items-center gap-2 font-semibold mb-4">
          <span className="text-orange-500">🔥</span> Popular tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/questions/tagged/${encodeURIComponent(tag.name)}`}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Unanswered Question */}
      {unansweredQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <span className="text-orange-500">🔥</span> Popular unanswered question
          </h3>
          {unansweredQuestions.map((question) => (
            <div key={question.id} className="space-y-2">
              <Link
                href={`/questions/${question.slug || question.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {question.title}
              </Link>
              <div className="flex flex-wrap gap-2 text-xs">
                {question.tags?.split(",").map((tag, idx) => (
                  <Link key={idx} href={`/questions/tagged/${encodeURIComponent(tag.trim())}`} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    {tag.trim()}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{question.username}</span>
                <span>{question.score}</span>
                <span>{formatDistanceToNow(new Date(question.created_at))} ago</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Related Questions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Related</h3>
        <div className="space-y-3">
          {relatedQuestions.map((question) => (
            <div key={question.id} className="flex gap-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-sm font-semibold ${
                  question.answer_count > 0
                    ? "bg-green-600 text-white"
                    : question.score > 0
                    ? "bg-gray-200 text-gray-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {question.score}
              </div>
              <Link
                href={`/questions/${question.slug || question.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 line-clamp-2"
              >
                {question.title}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* TukTuk Fair Prices */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Car className="w-4 h-4" /> Fair TukTuk Prices
        </h3>
        {tukTukRoutes.length > 0 ? (
          <>
            <div className="space-y-3">
              {tukTukRoutes.map((route, idx) => (
                <div key={idx} className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <span className="truncate">{route.start_location}</span>
                    <span className="text-gray-400">→</span>
                    <span className="truncate">{route.end_location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-blue-600 font-semibold text-base">
                      LKR {Math.round(route.avg_price)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {route.report_count} {route.report_count === 1 ? 'report' : 'reports'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/tuktuk-prices" 
              className="text-sm text-blue-600 hover:underline mt-3 block text-center border-t pt-3"
            >
              Report a price →
            </Link>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-3">
              Help travelers avoid overcharging!
            </p>
            <Link 
              href="/tuktuk-prices" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Be the first to report a price
            </Link>
          </div>
        )}
      </div>

      {/* Scam Watch */}
      {scamReports.length > 0 && (
        <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" /> Scam Watch: {currentTags[0]}
          </h3>
          <div className="space-y-3">
            {scamReports.map((scam) => (
              <div key={scam.id} className="text-sm">
                <div className="flex items-start gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      scam.severity === 'high'
                        ? 'bg-red-600'
                        : scam.severity === 'medium'
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-red-900 flex items-center gap-2">
                      {scam.title}
                      {scam.verified && (
                        <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">Verified</span>
                      )}
                    </div>
                    <p className="text-red-800 text-xs mt-1 leading-relaxed">
                      {scam.description}
                    </p>
                    <div className="text-xs text-red-600 mt-1 flex items-center gap-2">
                      <span>👍 {scam.upvotes}</span>
                      <span>•</span>
                      <span>by {scam.reported_by_username}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link 
            href="/scams" 
            className="text-sm text-red-700 hover:underline mt-3 block text-center border-t border-red-200 pt-3 font-medium"
          >
            Report a scam →
          </Link>
        </div>
      )}
    </div>
  );
}
