"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Car, TrendingUp, Calendar, MapPin } from "lucide-react";

interface RouteData {
  start_location: string;
  end_location: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  report_count: number;
  last_reported: string;
}

interface RecentReport {
  price: number;
  date_of_travel: string;
  additional_notes?: string;
  created_at: string;
}

export default function TukTukPricesPage() {
  const { data: session } = useSession();
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [price, setPrice] = useState("");
  const [dateOfTravel, setDateOfTravel] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [searchStart, setSearchStart] = useState("");
  const [searchEnd, setSearchEnd] = useState("");
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<RouteData[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      setMessage("Please log in to report prices");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/tuktuk-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_location: startLocation,
          end_location: endLocation,
          price: parseFloat(price),
          date_of_travel: dateOfTravel,
          additional_notes: notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Price reported successfully! Thank you for helping travelers.");
        setStartLocation("");
        setEndLocation("");
        setPrice("");
        setDateOfTravel("");
        setNotes("");
        fetchPopularRoutes();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchStart || !searchEnd) {
      setSearchError("Please enter both start and end locations");
      return;
    }

    setSearching(true);
    setSearchError("");
    setHasSearched(false);
    
    try {
      const response = await fetch(
        `/api/tuktuk-prices?start=${encodeURIComponent(searchStart)}&end=${encodeURIComponent(searchEnd)}`
      );
      const data = await response.json();

      if (response.ok) {
        setRouteData(data.route || null);
        setRecentReports(data.recent_reports || []);
        setHasSearched(true);
      } else {
        setSearchError(data.error || "Failed to search route");
      }
    } catch (error) {
      console.error("Error searching route:", error);
      setSearchError("Failed to search. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const fetchPopularRoutes = async () => {
    try {
      const response = await fetch("/api/tuktuk-prices?limit=10");
      const data = await response.json();
      setPopularRoutes(data.popular_routes || []);
    } catch (error) {
      console.error("Error fetching popular routes:", error);
    }
  };

  React.useEffect(() => {
    fetchPopularRoutes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Car className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold">TukTuk Fair Price Reporter</h1>
          </div>
          <p className="text-lg text-gray-600">
            Help fellow travelers by sharing what you paid for TukTuk rides. See real-time average prices for popular routes across Sri Lanka.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Report Price Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Report a Price
            </h2>

            {!session ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-gray-700 mb-4">Please log in to report TukTuk prices</p>
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
                    Start Location *
                  </label>
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="e.g., Colombo Fort Railway Station"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Location *
                  </label>
                  <input
                    type="text"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    placeholder="e.g., Galle Face Green"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Paid (LKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Travel *
                  </label>
                  <input
                    type="date"
                    value={dateOfTravel}
                    onChange={(e) => setDateOfTravel(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Heavy traffic, meter used, negotiated price..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded ${message.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? "Submitting..." : "Report Price"}
                </button>
              </form>
            )}
          </div>

          {/* Search Route Prices */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Check Fair Price
            </h2>

            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <input
                  type="text"
                  value={searchStart}
                  onChange={(e) => setSearchStart(e.target.value)}
                  placeholder="Start location"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={searchEnd}
                  onChange={(e) => setSearchEnd(e.target.value)}
                  placeholder="End location"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search Route"}
              </button>
            </form>

            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                {searchError}
              </div>
            )}

            {hasSearched && !routeData && !searchError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-center">
                <p className="text-gray-700 mb-2">No pricing data found for this route yet.</p>
                <p className="text-sm text-gray-600">Be the first to report a price for <strong>{searchStart} → {searchEnd}</strong></p>
              </div>
            )}

            {routeData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg mb-2">
                  {routeData.start_location} → {routeData.end_location}
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <div className="text-sm text-gray-600">Average Price</div>
                    <div className="text-2xl font-bold text-blue-600">
                      LKR {Math.round(routeData.avg_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Price Range</div>
                    <div className="text-lg font-semibold">
                      {Math.round(routeData.min_price)} - {Math.round(routeData.max_price)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Based on {routeData.report_count} reports (last 6 months)
                </div>
              </div>
            )}

            {recentReports.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recent Reports:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentReports.map((report, idx) => (
                    <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="flex justify-between">
                        <span className="font-semibold">LKR {report.price}</span>
                        <span className="text-gray-600">
                          {new Date(report.date_of_travel).toLocaleDateString()}
                        </span>
                      </div>
                      {report.additional_notes && (
                        <div className="text-gray-600 text-xs mt-1">{report.additional_notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Routes */}
        {popularRoutes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">Popular Routes & Fair Prices</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRoutes.map((route, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{route.start_location}</div>
                      <div className="text-gray-400 text-sm">↓</div>
                      <div className="font-semibold text-gray-900">{route.end_location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(route.avg_price)}
                      </div>
                      <div className="text-xs text-gray-500">LKR avg</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {route.report_count} reports
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
