"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Settings, Mail, Lock, Shield, User, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface UserSettings {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  email_verified: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  // Email settings
  const [newEmail, setNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  
  // Password settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      
      if (response.ok) {
        setUserSettings(data.user);
        setNewEmail(data.user.email || "");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitting(true);
    setEmailMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailMessage("✓ Email updated successfully! Please verify your new email address.");
        if (data.email_changed) {
          // Sign out user to re-authenticate with new email
          setTimeout(() => {
            signOut({ callbackUrl: "/login" });
          }, 2000);
        }
      } else {
        setEmailMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setEmailMessage("Failed to update email. Please try again.");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordMessage("");

    // Validation
    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters long");
      setPasswordSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match");
      setPasswordSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage("✓ Password changed successfully! Please log in again.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Sign out user to re-authenticate
        setTimeout(() => {
          signOut({ callbackUrl: "/login" });
        }, 2000);
      } else {
        setPasswordMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setPasswordMessage("Failed to change password. Please try again.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch("/api/verify-email/send", {
        method: "POST",
      });

      if (response.ok) {
        setEmailMessage("✓ Verification email sent! Check your inbox.");
      } else {
        setEmailMessage("Failed to send verification email. Please try again later.");
      }
    } catch (error) {
      setEmailMessage("Failed to send verification email.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold">Account Settings</h1>
          </div>
          <p className="text-lg text-gray-600">
            Manage your email, password, and security preferences
          </p>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Username:</span>
              <span className="font-medium">{userSettings?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Display Name:</span>
              <span className="font-medium">{userSettings?.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since:</span>
              <span className="font-medium">
                {userSettings?.created_at ? new Date(userSettings.created_at).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <Link
                href="/profile"
                className="text-blue-600 hover:underline text-sm"
              >
                Edit profile (display name, bio) →
              </Link>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Address
          </h2>

          {userSettings && !userSettings.email_verified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Your email address is not verified. 
                  <button
                    onClick={handleResendVerification}
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Resend verification email
                  </button>
                </p>
              </div>
            </div>
          )}

          {userSettings && userSettings.email_verified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Email verified</span>
            </div>
          )}

          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newEmail || ""}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Changing your email will require re-verification and you'll need to log in again
              </p>
            </div>

            {emailMessage && (
              <div className={`p-3 rounded text-sm ${emailMessage.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {emailMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={emailSubmitting || newEmail === userSettings?.email}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {emailSubmitting ? "Updating..." : "Update Email"}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded text-sm ${passwordMessage.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {passwordMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {passwordSubmitting ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Use a strong, unique password for your account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Verify your email address to secure your account and earn reputation points</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Never share your password with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>If you suspect unauthorized access, change your password immediately</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
