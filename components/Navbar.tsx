"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut, Search, Home, Users, AlertTriangle, MessageSquarePlus, MoreHorizontal } from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [exploreDropdownOpen, setExploreDropdownOpen] = useState(false);
  const [userReputation, setUserReputation] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  // Rotating search placeholders for better UX
  const searchPlaceholders = [
    "Search for 'Visa on arrival'...",
    "Search 'Train to Ella'...",
    "Search 'Best beaches in Sri Lanka'...",
    "Search 'Sigiriya tickets'...",
    "Search 'Safe areas in Colombo'...",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholder text every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user reputation for review queue access
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.profile?.reputation !== undefined) {
            setUserReputation(data.profile.reputation);
          }
        })
        .catch(err => console.error('Failed to fetch user reputation:', err));
    }
  }, [session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">OneCeylon</h1>
            </Link>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={searchPlaceholders[placeholderIndex]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-3 lg:gap-6 items-center shrink-0">
              {/* Primary Navigation */}
              <Link href="/questions" className="text-gray-700 hover:text-blue-600 font-medium whitespace-nowrap text-sm lg:text-base">
                Questions
              </Link>
              <Link href="/tuktuk-prices" className="text-gray-700 hover:text-blue-600 font-medium whitespace-nowrap text-sm lg:text-base">
                TukTuk Prices
              </Link>
              <Link href="/scams" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 whitespace-nowrap text-sm lg:text-base">
                <AlertTriangle className="w-4 h-4" />
                Scams
              </Link>

              {/* Explore Dropdown (Secondary Navigation) */}
              <div 
                className="relative"
                onMouseEnter={() => setExploreDropdownOpen(true)}
                onMouseLeave={() => setExploreDropdownOpen(false)}
              >
                <button className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1 whitespace-nowrap text-sm lg:text-base">
                  Explore
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {exploreDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2">
                    <Link
                      href="/tags"
                      className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      Tags
                    </Link>
                    <Link
                      href="/users"
                      className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      Users
                    </Link>
                    <Link
                      href="/collectives"
                      className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      Communities
                    </Link>
                    {session && userReputation >= 100 && (
                      <Link
                        href="/review"
                        className="block px-4 py-2 hover:bg-purple-50 text-purple-600 border-t"
                      >
                        Review Queue
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {session ? (
                <>
                  <Link
                    href="/questions/ask"
                    className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm lg:text-base whitespace-nowrap"
                  >
                    Ask Question
                  </Link>
                  <NotificationDropdown />
                  <div className="relative group">
                    <button className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 rounded hover:bg-gray-100">
                      <User className="w-5 h-5" />
                      <span className="text-sm lg:text-base max-w-[100px] lg:max-w-none truncate">{session.user?.name || session.user?.email}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2 text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 lg:px-4 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm lg:text-base"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm lg:text-base"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Top Bar: Search Icon + Notification + More Menu */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <Search className="w-5 h-5" />
              </button>
              {session && <NotificationDropdown />}
              <button
                className="p-2 hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Dropdown */}
          {mobileSearchOpen && (
            <form onSubmit={handleSearch} className="md:hidden mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchPlaceholders[placeholderIndex]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>
          )}

          {/* Mobile More Menu (Secondary Items) */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Explore</div>
              <Link
                href="/tags"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tags
              </Link>
              <Link
                href="/users"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Users
              </Link>
              <Link
                href="/collectives"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Communities
              </Link>
              {session && userReputation >= 100 && (
                <Link
                  href="/review"
                  className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Review Queue
                </Link>
              )}

              {session ? (
                <>
                  <div className="border-t pt-2 mt-2">
                    <Link
                      href="/settings"
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded text-left flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t pt-2 mt-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 block text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {/* Home */}
          <Link
            href="/questions"
            className={`flex flex-col items-center justify-center gap-1 ${
              pathname === '/questions' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>

          {/* Collectives */}
          <Link
            href="/collectives"
            className={`flex flex-col items-center justify-center gap-1 ${
              pathname?.startsWith('/collectives') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Community</span>
          </Link>

          {/* Ask Question (Center - Prominent) */}
          <Link
            href="/questions/ask"
            className="flex flex-col items-center justify-center -mt-4"
          >
            <div className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700">
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <span className="text-xs text-gray-600 mt-1">Ask</span>
          </Link>

          {/* Scams/Safety */}
          <Link
            href="/scams"
            className={`flex flex-col items-center justify-center gap-1 ${
              pathname === '/scams' ? 'text-orange-600' : 'text-gray-600'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs">Safety</span>
          </Link>

          {/* Profile */}
          {session ? (
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center gap-1 ${
                pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center justify-center gap-1 text-gray-600"
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Add bottom padding to content when bottom nav is visible */}
      <style jsx global>{`
        @media (max-width: 767px) {
          body {
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </>
  );
}
