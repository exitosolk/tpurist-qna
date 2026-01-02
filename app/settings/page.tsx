"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Settings, Mail, Lock, Shield, User, AlertCircle, CheckCircle, ChevronRight, ChevronDown, Bell, BellOff } from "lucide-react";
import Link from "next/link";

interface UserSettings {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  email_verified: boolean;
  created_at: string;
  digest_frequency?: 'never' | 'daily' | 'weekly';
}

interface NotificationPreferences {
  email_new_answer: boolean;
  email_new_comment: boolean;
  email_question_upvote: boolean;
  email_question_downvote: boolean;
  email_answer_upvote: boolean;
  email_answer_downvote: boolean;
  email_accepted_answer: boolean;
  email_badge_earned: boolean;
  email_followed_question: boolean;
  app_new_answer: boolean;
  app_new_comment: boolean;
  app_question_upvote: boolean;
  app_question_downvote: boolean;
  app_answer_upvote: boolean;
  app_answer_downvote: boolean;
  app_accepted_answer: boolean;
  app_badge_earned: boolean;
  app_followed_question: boolean;
  digest_frequency: 'none' | 'daily' | 'weekly';
  digest_include_new_questions: boolean;
  digest_include_top_questions: boolean;
  digest_include_followed_tags: boolean;
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
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  
  // Email change tracking
  const [emailChanged, setEmailChanged] = useState(false);
  
  // Digest preferences
  const [digestFrequency, setDigestFrequency] = useState<'never' | 'daily' | 'weekly'>('weekly');
  const [digestMessage, setDigestMessage] = useState("");
  const [digestSubmitting, setDigestSubmitting] = useState(false);

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [notifPrefsExpanded, setNotifPrefsExpanded] = useState(false);
  const [notifPrefsMessage, setNotifPrefsMessage] = useState("");
  const [notifPrefsSubmitting, setNotifPrefsSubmitting] = useState(false);

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
        // Convert MySQL boolean (0/1) to JavaScript boolean
        const user = {
          ...data.user,
          email_verified: Boolean(data.user.email_verified)
        };
        setUserSettings(user);
        setNewEmail(data.user.email || "");
        setEmailChanged(false);
        setDigestFrequency(data.user.digest_frequency || 'weekly');
      }

      // Fetch notification preferences
      const prefsResponse = await fetch("/api/notifications/preferences");
      const prefsData = await prefsResponse.json();
      if (prefsResponse.ok && prefsData.preferences) {
        setNotificationPrefs(prefsData.preferences);
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

  const handleDigestUpdate = async (frequency: 'never' | 'daily' | 'weekly') => {
    setDigestSubmitting(true);
    setDigestMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest_frequency: frequency }),
      });

      const data = await response.json();

      if (response.ok) {
        setDigestFrequency(frequency);
        setDigestMessage("✓ Email digest preferences updated successfully!");
        setTimeout(() => setDigestMessage(""), 3000);
      } else {
        setDigestMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setDigestMessage("Failed to update digest preferences. Please try again.");
    } finally {
      setDigestSubmitting(false);
    }
  };

  const handleNotificationPrefUpdate = async (field: keyof NotificationPreferences, value: boolean | string) => {
    if (!notificationPrefs) return;

    setNotifPrefsSubmitting(true);
    setNotifPrefsMessage("");

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      const data = await response.json();

      if (response.ok && data.preferences) {
        setNotificationPrefs(data.preferences);
        setNotifPrefsMessage("✓ Preferences updated!");
        setTimeout(() => setNotifPrefsMessage(""), 2000);
      } else {
        setNotifPrefsMessage(`Error: ${data.error || 'Failed to update'}`);
      }
    } catch (error) {
      setNotifPrefsMessage("Failed to update preferences. Please try again.");
    } finally {
      setNotifPrefsSubmitting(false);
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
        {/* Header - Simplified */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold">Account Settings</h1>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-4">
          <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Address
          </h2>

          {userSettings && !userSettings.email_verified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2 md:gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-700">
                  Your email is not verified. 
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

          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={newEmail || ""}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailChanged(e.target.value !== userSettings?.email);
                  }}
                  className="w-full px-4 py-2 md:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                  required
                />
                {userSettings && userSettings.email_verified && !emailChanged && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs md:text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Verified</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Changing your email will require re-verification
              </p>
            </div>

            {emailMessage && (
              <div className={`p-3 rounded text-xs md:text-sm ${emailMessage.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {emailMessage}
              </div>
            )}

            {emailChanged && (
              <button
                type="submit"
                disabled={emailSubmitting}
                className="w-full md:w-auto px-6 py-2.5 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {emailSubmitting ? "Updating..." : "Update Email"}
              </button>
            )}
          </form>
        </div>

        {/* Password Settings - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <button
            onClick={() => setPasswordExpanded(!passwordExpanded)}
            className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-700" />
              <span className="text-lg md:text-xl font-bold">Change Password</span>
            </div>
            {passwordExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {passwordExpanded && (
            <div className="px-4 md:px-6 pb-4 md:pb-6 border-t">
              <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 md:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 md:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 md:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {passwordMessage && (
                  <div className={`p-3 rounded text-xs md:text-sm ${passwordMessage.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {passwordMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="w-full md:w-auto px-6 py-2.5 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {passwordSubmitting ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Notification Preferences - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <button
            onClick={() => setNotifPrefsExpanded(!notifPrefsExpanded)}
            className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="text-lg md:text-xl font-bold">Notification Preferences</span>
            </div>
            {notifPrefsExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {notifPrefsExpanded && notificationPrefs && (
            <div className="px-4 md:px-6 pb-4 md:pb-6 border-t">
              <div className="mt-4 space-y-6">
                {/* Email Notifications */}
                <div>
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Notifications
                  </h3>
                  <div className="space-y-3 pl-6">
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">New answers to your questions</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.email_new_answer}
                        onChange={(e) => handleNotificationPrefUpdate('email_new_answer', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Comments on your posts</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.email_new_comment}
                        onChange={(e) => handleNotificationPrefUpdate('email_new_comment', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Your answer is upvoted</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.email_answer_upvote}
                        onChange={(e) => handleNotificationPrefUpdate('email_answer_upvote', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Your answer is accepted</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.email_accepted_answer}
                        onChange={(e) => handleNotificationPrefUpdate('email_accepted_answer', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">New badge earned</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.email_badge_earned}
                        onChange={(e) => handleNotificationPrefUpdate('email_badge_earned', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2">
                      <span className="text-sm">New answers to followed questions</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.email_followed_question}
                        onChange={(e) => handleNotificationPrefUpdate('email_followed_question', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* In-App Notifications */}
                <div>
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    In-App Notifications
                  </h3>
                  <div className="space-y-3 pl-6">
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">New answers to your questions</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.app_new_answer}
                        onChange={(e) => handleNotificationPrefUpdate('app_new_answer', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Comments on your posts</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.app_new_comment}
                        onChange={(e) => handleNotificationPrefUpdate('app_new_comment', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Question upvotes</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.app_question_upvote}
                        onChange={(e) => handleNotificationPrefUpdate('app_question_upvote', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Answer upvotes</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.app_answer_upvote}
                        onChange={(e) => handleNotificationPrefUpdate('app_answer_upvote', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Your answer is accepted</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.app_accepted_answer}
                        onChange={(e) => handleNotificationPrefUpdate('app_accepted_answer', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">New badge earned</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.app_badge_earned}
                        onChange={(e) => handleNotificationPrefUpdate('app_badge_earned', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between py-2">
                      <span className="text-sm">New answers to followed questions</span>
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs.app_followed_question}
                        onChange={(e) => handleNotificationPrefUpdate('app_followed_question', e.target.checked)}
                        disabled={notifPrefsSubmitting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {notifPrefsMessage && (
                  <div className={`p-3 rounded text-xs md:text-sm ${notifPrefsMessage.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {notifPrefsMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Email Digest Preferences */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-4">
          <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Email Digest
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Get a summary of new answers to questions you follow and new questions in tags you follow.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="digest"
                value="weekly"
                checked={digestFrequency === 'weekly'}
                onChange={() => handleDigestUpdate('weekly')}
                disabled={digestSubmitting}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Weekly Digest</div>
                <div className="text-xs text-gray-500">Receive a summary once a week (Recommended)</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="digest"
                value="daily"
                checked={digestFrequency === 'daily'}
                onChange={() => handleDigestUpdate('daily')}
                disabled={digestSubmitting}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Daily Digest</div>
                <div className="text-xs text-gray-500">Receive a summary every day</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="digest"
                value="never"
                checked={digestFrequency === 'never'}
                onChange={() => handleDigestUpdate('never')}
                disabled={digestSubmitting}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  Never
                  <BellOff className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500">Don't send me digest emails</div>
              </div>
            </label>
          </div>

          {digestMessage && (
            <div className={`mt-4 p-3 rounded text-xs md:text-sm ${digestMessage.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {digestMessage}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Link
              href="/api/digest/preview"
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              Preview digest email →
            </Link>
          </div>
        </div>

        {/* Profile Link */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <Link
            href="/profile"
            className="flex items-center justify-between hover:bg-gray-50 -m-4 md:-m-6 p-4 md:p-6 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              {userSettings && (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg md:text-xl">
                  {userSettings.display_name?.[0]?.toUpperCase() || userSettings.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-bold text-base md:text-lg">{userSettings?.display_name || userSettings?.username}</div>
                <div className="text-xs md:text-sm text-gray-500">Edit profile, bio, and display name</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </main>
    </div>
  );
}
