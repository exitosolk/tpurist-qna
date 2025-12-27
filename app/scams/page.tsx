"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ScamReport {
  id: number;
  tag: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  upvotes: number;
  verified: boolean;
  reported_by_username: string;
  created_at: string;
}

export default function ScamsPage() {
  const { data: session } = useSession();
  const [tag, setTag] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [recentScams, setRecentScams] = useState<ScamReport[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      setMessage("Please log in to report scams");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/scam-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag,
          title,
          description,
          severity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Scam report submitted successfully! Thank you for helping travelers stay safe.");
        setTag("");
        setTitle("");
        setDescription("");
        setSeverity("medium");
        fetchRecentScams();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchRecentScams = async () => {
    // For now, just show popular tags - in real implementation, show recent scams
    // You could fetch from multiple tags or show all recent scams
  };

  useEffect(() => {
    fetchRecentScams();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-10 h-10 text-red-600" />
            <h1 className="text-4xl font-bold">Scam Watch</h1>
          </div>
          <p className="text-lg text-gray-600">
            Help protect fellow travelers by reporting scams, overcharging, and tourist traps. Your reports help create a safer travel community.
          </p>
        </div>

        {/* Report Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Report a Scam</h2>

          {!session ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 mb-4">Please log in to report scams</p>
              <a
                href="/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Log In
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Tag/Location *
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g., Colombo, TukTuk, Kandy, Galle"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the tag/location where this scam commonly occurs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scam Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Fake Government TukTuk Drivers"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the scam and how travelers can avoid it..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity Level *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as "low" | "medium" | "high")}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Financial loss possible</option>
                  <option value="high">High - Significant risk or common scam</option>
                </select>
              </div>

              {message && (
                <div className={`p-3 rounded ${message.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {submitting ? "Submitting..." : "Report Scam"}
              </button>
            </form>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            How Scam Watch Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Community members report scams they've encountered or heard about</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Other travelers can upvote reports to verify legitimacy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Verified scams appear in the sidebar for relevant tags (Colombo, TukTuk, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>High-severity scams are prioritized to protect travelers</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
