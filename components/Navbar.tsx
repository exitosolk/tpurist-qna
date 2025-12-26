"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-blue-600">OneCeylon</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 items-center">
            <Link href="/questions" className="text-gray-700 hover:text-blue-600 font-medium">
              Questions
            </Link>
            <Link href="/tags" className="text-gray-700 hover:text-blue-600">
              Tags
            </Link>
            <Link href="/users" className="text-gray-700 hover:text-blue-600">
              Users
            </Link>

            {session ? (
              <>
                <Link
                  href="/questions/ask"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ask Question
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100">
                    <User className="w-5 h-5" />
                    <span>{session.user?.name || session.user?.email}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2"
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
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-2">
            <Link
              href="/questions"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => setMobileMenuOpen(false)}
            >
              Questions
            </Link>
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

            {session ? (
              <>
                <Link
                  href="/questions/ask"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ask Question
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile ({session.user?.name || session.user?.email})
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
