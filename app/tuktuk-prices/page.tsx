"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Car, TrendingUp, Calendar, MapPin, AlertCircle, CheckCircle, Zap, TrendingDown, Info, Circle } from "lucide-react";

interface RouteData {
  start_location: string;
  end_location: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  avg_distance: number;
  avg_per_km: number;
  report_count: number;
  last_reported: string;
  reports_last_week: number;
}

interface FairPricing {
  min: number;
  max: number;
  fair: number;
}

interface RecentReport {
  price: number;
  distance_km?: number;
  price_per_km?: number;
  date_of_travel: string;
  additional_notes?: string;
  created_at: string;
  is_anonymous: boolean;
}

interface LivePulseReport {
  start_location: string;
  end_location: string;
  price: number;
  created_at: string;
  distance_km?: number;
}

interface PerKmRate {
  avg_per_km: number;
  min_per_km: number;
  max_per_km: number;
  total_reports: number;
}

export default function TukTukPricesPage() {
  const { data: session } = useSession();
  
  // Search state
  const [searchStart, setSearchStart] = useState("");
  const [searchStartPlaceId, setSearchStartPlaceId] = useState("");
  const [searchEnd, setSearchEnd] = useState("");
  const [searchEndPlaceId, setSearchEndPlaceId] = useState("");
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [fairPricing, setFairPricing] = useState<FairPricing | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchDistance, setSearchDistance] = useState<number | null>(null);

  // Report state
  const [startLocation, setStartLocation] = useState("");
  const [startPlaceId, setStartPlaceId] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [endPlaceId, setEndPlaceId] = useState("");
  const [price, setPrice] = useState("");
  const [dateOfTravel, setDateOfTravel] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [reportDistance, setReportDistance] = useState<number | null>(null);

  // Live data
  const [popularRoutes, setPopularRoutes] = useState<RouteData[]>([]);
  const [livePulse, setLivePulse] = useState<LivePulseReport[]>([]);
  const [perKmRate, setPerKmRate] = useState<PerKmRate | null>(null);

  // UI state
  const [showCalculation, setShowCalculation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/tuktuk-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_location: startLocation,
          start_place_id: startPlaceId,
          end_location: endLocation,
          end_place_id: endPlaceId,
          price: parseFloat(price),
          distance_km: reportDistance,
          date_of_travel: dateOfTravel,
          additional_notes: notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Price reported successfully! Thank you for helping travelers.");
        setStartLocation("");
        setStartPlaceId("");
        setEndLocation("");
        setEndPlaceId("");
        setPrice("");
        setDateOfTravel("");
        setNotes("");
        setReportDistance(null);
        
        // Refresh data
        fetchPopularRoutes();
        fetchLivePulse();
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
      const params = new URLSearchParams({
        start: searchStartPlaceId || searchStart,
        end: searchEndPlaceId || searchEnd,
      });

      const response = await fetch(`/api/tuktuk-prices?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRouteData(data.route || null);
        setFairPricing(data.fair_pricing || null);
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

  const fetchLivePulse = async () => {
    try {
      const response = await fetch("/api/tuktuk-prices?type=recent&limit=8");
      const data = await response.json();
      setLivePulse(data.recent_reports || []);
    } catch (error) {
      console.error("Error fetching live pulse:", error);
    }
  };

  const fetchPerKmRate = async () => {
    try {
      const response = await fetch("/api/tuktuk-prices?type=per-km");
      const data = await response.json();
      setPerKmRate(data.per_km_rate || null);
    } catch (error) {
      console.error("Error fetching per-km rate:", error);
    }
  };

  React.useEffect(() => {
    fetchPopularRoutes();
    fetchLivePulse();
    fetchPerKmRate();
    
    // Refresh live pulse every 30 seconds
    const interval = setInterval(fetchLivePulse, 30000);
    return () => clearInterval(interval);
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
            Check real-time fair prices and help fellow travelers by sharing your TukTuk ride costs across Sri Lanka.
          </p>
        </div>

        {/* Per KM Quick Check - High Value Info First */}
        {perKmRate && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Sri Lankan TukTuk Fair Pricing</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm opacity-90">First Kilometer</div>
                <div className="text-3xl font-bold">
                  100-120 LKR
                </div>
                <div className="text-xs opacity-75 mt-1">Standard starting rate</div>
              </div>
              <div>
                <div className="text-sm opacity-90">Additional Kilometers</div>
                <div className="text-2xl font-semibold">
                  80-100 LKR/km
                </div>
                <div className="text-xs opacity-75 mt-1">Each km after the first</div>
              </div>
              <div>
                <div className="text-sm opacity-90">Community Data</div>
                <div className="text-lg">
                  Avg: {Math.round(perKmRate.avg_per_km)} LKR/km
                </div>
                <div className="text-xs opacity-75 mt-1">Based on {perKmRate.total_reports} rides</div>
              </div>
            </div>
          </div>
        )}

        {/* Live Pulse Section - Social Proof */}
        {livePulse.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold">Live Pulse</h2>
              <span className="text-sm text-gray-500">· Recent reports from travelers</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {livePulse.map((report, idx) => {
                const timeAgo = getTimeAgo(new Date(report.created_at));
                const cleanStart = sanitizeAddress(report.start_location);
                const cleanEnd = sanitizeAddress(report.end_location);
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg hover:bg-gray-100 transition p-3">
                    {/* Mobile-first vertical layout with timeline pattern */}
                    <div className="flex gap-3">
                      {/* Timeline icons */}
                      <div className="flex flex-col items-center pt-1">
                        <Circle className="w-3 h-3 text-green-500 fill-green-500" />
                        <div className="w-px h-full bg-gray-300 my-1"></div>
                        <MapPin className="w-4 h-4 text-blue-500 fill-blue-500" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        {/* Route info */}
                        <div className="text-sm space-y-1">
                          <div className="font-medium text-gray-900 truncate">{cleanStart}</div>
                          <div className="font-medium text-gray-900 truncate">{cleanEnd}</div>
                        </div>
                        
                        {/* Divider */}
                        <div className="border-t border-gray-200"></div>
                        
                        {/* Meta info and price */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-gray-500 flex items-center gap-1.5">
                            <span>{timeAgo}</span>
                            {report.distance_km && (
                              <>
                                <span>•</span>
                                <span>{Number(report.distance_km).toFixed(1)} km</span>
                              </>
                            )}
                          </div>
                          {/* Price badge - informational, not actionable */}
                          <div className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded font-bold text-base border border-blue-200">
                            {Math.round(report.price)} LKR
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Check Price Form - NOW FIRST! */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Check Fair Price
            </h2>

            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <LocationAutocomplete
                value={searchStart}
                onChange={(val, placeId) => {
                  setSearchStart(val);
                  if (placeId) setSearchStartPlaceId(placeId);
                }}
                label="From"
                placeholder="Start location (e.g., Colombo Fort)"
                onPlaceSelected={(place, distance) => {
                  if (distance && searchEndPlaceId) {
                    setSearchDistance(distance);
                  }
                }}
              />

              <LocationAutocomplete
                value={searchEnd}
                onChange={(val, placeId) => {
                  setSearchEnd(val);
                  if (placeId) setSearchEndPlaceId(placeId);
                }}
                label="To"
                placeholder="End location (e.g., Galle Face)"
                fromPlaceId={searchStartPlaceId}
                onPlaceSelected={(place, distance) => {
                  if (distance) setSearchDistance(distance);
                }}
              />

              {searchDistance && (
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  📍 Distance: ~{Number(searchDistance).toFixed(1)} km
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={searching}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
                >
                  {searching ? "Searching..." : "Search Route"}
                </button>
                
                {(searchStart || searchEnd) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchStart("");
                      setSearchStartPlaceId("");
                      setSearchEnd("");
                      setSearchEndPlaceId("");
                      setSearchDistance(null);
                      setRouteData(null);
                      setFairPricing(null);
                      setRecentReports([]);
                      setHasSearched(false);
                      setSearchError("");
                    }}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    title="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                {searchError}
              </div>
            )}

            {hasSearched && !routeData && !searchError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-3 font-medium">No pricing data found for this route yet.</p>
                <p className="text-sm text-gray-600 mb-3">
                  Be the first to report a price for <strong>{searchStart} → {searchEnd}</strong>
                </p>
                <button
                  onClick={() => {
                    setStartLocation(searchStart);
                    setStartPlaceId(searchStartPlaceId);
                    setEndLocation(searchEnd);
                    setEndPlaceId(searchEndPlaceId);
                    setReportDistance(searchDistance);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  → Fill report form below
                </button>
              </div>
            )}

            {routeData && (
              <div className="space-y-4">
                {/* Fair Price Range with Trust Indicators */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-5">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {routeData.start_location} → {routeData.end_location}
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Fair Price Based on Distance */}
                    {fairPricing ? (
                      <>
                        <div className="bg-white/70 rounded-lg p-4 border-2 border-green-300">
                          <div className="text-sm font-semibold text-green-800 mb-2 flex items-center justify-between">
                            <span>✅ Fair Price ({Number(routeData.avg_distance).toFixed(1)} km)</span>
                            <button
                              onClick={() => setShowCalculation(!showCalculation)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Info className="w-3 h-3" />
                              {showCalculation ? 'Hide' : 'See'} breakdown
                            </button>
                          </div>
                          <div className="text-3xl font-bold text-green-700 mb-2">
                            {Math.round(fairPricing.min)} - {Math.round(fairPricing.max)} LKR
                          </div>
                          
                          {/* Collapsible calculation */}
                          {showCalculation && (
                            <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="font-semibold mb-1">How we calculate fair price:</div>
                              <div>• First km: 100-120 LKR</div>
                              {Number(routeData.avg_distance) > 1 && (
                                <div>• Next {(Number(routeData.avg_distance) - 1).toFixed(1)} km: × 80-100 LKR/km</div>
                              )}
                              <div className="mt-1 font-semibold">= {Math.round(fairPricing.min)} - {Math.round(fairPricing.max)} LKR</div>
                            </div>
                          )}
                        </div>

                        {/* Visual Price Meter */}
                        <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-3">Price Check</div>
                          
                          {/* Visual meter bar */}
                          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div className="absolute h-full bg-green-400" style={{ width: '33%' }}></div>
                            <div className="absolute h-full bg-yellow-300 left-[33%]" style={{ width: '33%' }}></div>
                            <div className="absolute h-full bg-red-400 left-[66%]" style={{ width: '34%' }}></div>
                            
                            {/* Price indicator */}
                            {(() => {
                              const avgPrice = routeData.avg_price;
                              const fairMax = fairPricing.max;
                              const ripoffThreshold = fairMax * 1.5;
                              let position = 0;
                              
                              if (avgPrice <= fairMax) {
                                position = (avgPrice / fairMax) * 33;
                              } else if (avgPrice <= fairMax * 1.3) {
                                position = 33 + ((avgPrice - fairMax) / (fairMax * 0.3)) * 33;
                              } else {
                                position = Math.min(66 + ((avgPrice - fairMax * 1.3) / (fairMax * 0.2)) * 34, 95);
                              }
                              
                              return (
                                <div 
                                  className="absolute top-0 h-full w-1 bg-gray-800"
                                  style={{ left: `${position}%` }}
                                >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap">
                                    ▼ {Math.round(avgPrice)}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Legend */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-semibold text-green-700">Fair Deal</div>
                              <div className="text-gray-600">≤ {Math.round(fairPricing.max)}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-yellow-700">Negotiable</div>
                              <div className="text-gray-600">{Math.round(fairPricing.max)}-{Math.round(fairPricing.max * 1.3)}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-red-700">Rip-off</div>
                              <div className="text-gray-600">≥ {Math.round(fairPricing.max * 1.3)}</div>
                            </div>
                          </div>
                        </div>

                        {/* What People Actually Paid */}
                        <div className="bg-white/50 rounded-lg p-3 border border-blue-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            📊 What Travelers Reported
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(routeData.min_price)} - {Math.round(routeData.max_price)} LKR
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Average paid: {Math.round(routeData.avg_price)} LKR
                            {routeData.avg_price > fairPricing.max * 1.2 && (
                              <span className="text-red-600 font-semibold ml-2">
                                ⚠️ Overpaid by ~{Math.round(routeData.avg_price - fairPricing.fair)} LKR
                              </span>
                            )}
                            {routeData.avg_price <= fairPricing.max && (
                              <span className="text-green-600 font-semibold ml-2">
                                ✓ Fair deals reported
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">📊 Reported Price Range</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {Math.round(routeData.min_price)} - {Math.round(routeData.max_price)} LKR
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Average: {Math.round(routeData.avg_price)} LKR
                        </div>
                      </div>
                    )}

                    {/* Rip-off Alert */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-700 font-semibold">
                          Rip-off Alert: {fairPricing ? Math.round(fairPricing.max * 1.5) : Math.round(routeData.max_price * 1.5)}+ LKR
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Don't pay more than 50% above fair price
                      </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-3 border-t border-gray-200 space-y-1">
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Based on <strong>{routeData.report_count} {pluralize(routeData.report_count, 'report')}</strong> in the last 6 months
                      </div>
                      {routeData.reports_last_week > 0 && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {routeData.reports_last_week} {pluralize(routeData.reports_last_week, 'report')} this week (data is fresh!)
                        </div>
                      )}
                      {routeData.avg_distance && (
                        <div className="text-xs text-gray-600">
                          📍 Approx. distance: {Number(routeData.avg_distance).toFixed(1)} km
                        </div>
                      )}
                      {routeData.avg_per_km && (
                        <div className="text-xs text-gray-600">
                          Per km: ~{Math.round(routeData.avg_per_km)} LKR/km
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Reports */}
                {recentReports.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-gray-700">Recent Reports:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentReports.map((report, idx) => (
                        <div key={idx} className="text-sm p-3 bg-gray-50 rounded border border-gray-200">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-blue-600">LKR {report.price}</span>
                            <span className="text-gray-600 text-xs">
                              {new Date(report.date_of_travel).toLocaleDateString()}
                            </span>
                          </div>
                          {report.distance_km && (
                            <div className="text-xs text-gray-600">
                              {Number(report.distance_km).toFixed(1)} km · {report.price_per_km ? `${Math.round(Number(report.price_per_km))} LKR/km` : ''}
                            </div>
                          )}
                          {report.additional_notes && (
                            <div className="text-gray-600 text-xs mt-1 italic">"{report.additional_notes}"</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Report Price Form - NOW SECOND! */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Report a Price
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <LocationAutocomplete
                value={startLocation}
                onChange={(val, placeId) => {
                  setStartLocation(val);
                  if (placeId) setStartPlaceId(placeId);
                }}
                label="Start Location"
                placeholder="e.g., Colombo Fort Railway Station"
                required
                onPlaceSelected={(place, distance) => {
                  if (distance && endPlaceId) {
                    setReportDistance(distance);
                  }
                }}
              />

              <LocationAutocomplete
                value={endLocation}
                onChange={(val, placeId) => {
                  setEndLocation(val);
                  if (placeId) setEndPlaceId(placeId);
                }}
                label="End Location"
                placeholder="e.g., Galle Face Green"
                required
                fromPlaceId={startPlaceId}
                onPlaceSelected={(place, distance) => {
                  if (distance) setReportDistance(distance);
                }}
              />

              {reportDistance && (
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  📍 Distance: ~{Number(reportDistance).toFixed(1)} km
                  {price && ` · Per km: ${Math.round(parseFloat(price) / Number(reportDistance))} LKR/km`}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Paid (LKR) <span className="text-red-500">*</span>
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
                  Date of Travel <span className="text-red-500">*</span>
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

              {!session && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-gray-700">
                    ℹ️ No login required! Your report helps travelers anonymously.
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <a href="/login" className="text-blue-600 hover:underline">Log in</a> to earn "Local Expert" badges 🏆
                  </p>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded ${message.includes('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg"
              >
                {submitting ? "Submitting..." : "Submit Price Report"}
              </button>
            </form>
          </div>
        </div>

        {/* Popular Routes */}
        {popularRoutes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">Popular Routes & Fair Prices</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRoutes.map((route, idx) => (
                <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition cursor-pointer"
                  onClick={() => {
                    setSearchStart(route.start_location);
                    setSearchEnd(route.end_location);
                    handleSearch(new Event('submit') as any);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{route.start_location}</div>
                      <div className="text-gray-400 text-sm my-1">↓</div>
                      <div className="font-semibold text-gray-900 text-sm">{route.end_location}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(route.avg_price)}
                      </div>
                      <div className="text-xs text-gray-500">LKR avg</div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 space-y-1">
                    <div className="text-xs text-gray-600">
                      Fair: {Math.round(route.min_price)} - {Math.round(route.max_price)} LKR
                    </div>
                    <div className="text-xs text-red-600">
                      Rip-off: {Math.round(route.max_price * 1.5)}+ LKR
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                      <Calendar className="w-3 h-3" />
                      {route.report_count} {pluralize(route.report_count, 'report')}
                    </div>
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

// Utility function to calculate time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

// Sanitize address for display (remove zip codes, "Sri Lanka", etc.)
function sanitizeAddress(address: string): string {
  return address
    .replace(/, Sri Lanka/gi, '') // Remove "Sri Lanka"
    .replace(/\s*\d{5,6}\s*/g, ' ') // Remove zip codes (5-6 digits)
    .replace(/,\s*,/g, ',') // Remove double commas
    .trim();
}

// Get price status and color based on fair pricing
function getPriceStatus(actualPrice: number, fairMin: number, fairMax: number): {
  status: string;
  color: string;
  bgColor: string;
} {
  if (actualPrice <= fairMax) {
    return { status: 'Fair Deal', color: 'text-green-700', bgColor: 'bg-green-100' };
  } else if (actualPrice <= fairMax * 1.3) {
    return { status: 'Negotiable', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
  } else {
    return { status: 'Rip-off', color: 'text-red-700', bgColor: 'bg-red-100' };
  }
}

// Pluralize helper
function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + 's');
}
