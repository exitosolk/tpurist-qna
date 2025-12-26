"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus("error");
      setMessage("No verification token provided");
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`/api/verify-email/verify?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        setPointsEarned(data.pointsEarned || 0);
        setAlreadyVerified(data.alreadyVerified || false);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to verify email");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred while verifying your email");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {status === "loading" && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {alreadyVerified ? "Already Verified" : "Email Verified!"}
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {!alreadyVerified && pointsEarned > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-semibold">
                    🎉 You earned {pointsEarned} reputation points!
                  </p>
                </div>
              )}

              <Link
                href="/profile"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Go to Your Profile
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <Link
                  href="/profile"
                  className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Profile
                </Link>
                <p className="text-sm text-gray-500">
                  You can request a new verification email from your profile page
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
