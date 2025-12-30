'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Toast from './Toast';

interface FlagButtonProps {
  contentType: 'question' | 'answer' | 'comment';
  contentId: number;
  authorId?: number; // The user ID of the content owner
  compact?: boolean;
  onFlagged?: () => void;
}

export default function FlagButton({ contentType, contentId, authorId, compact = false, onFlagged }: FlagButtonProps) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Don't show flag button if user is not logged in or if they own the content
  if (!session) {
    return null;
  }

  const currentUserId = session.user?.id ? parseInt(session.user.id) : null;
  if (authorId && currentUserId === authorId) {
    return null; // Don't allow users to flag their own content
  }

  const handleFlag = async (reviewType: 'spam_scam' | 'outdated') => {
    try {
      setFlagging(true);
      setShowMenu(false);
      
      const response = await fetch('/api/review/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reviewType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to flag content');
      }

      setToast({
        message: 'Content flagged for review. Thank you for helping keep the community safe!',
        type: 'success'
      });
      
      onFlagged?.();
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to flag content. Please try again.',
        type: 'error'
      });
    } finally {
      setFlagging(false);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={flagging}
          className={`${
            compact
              ? 'text-gray-500 hover:text-red-600 text-sm'
              : 'text-gray-600 hover:text-red-600 px-2 py-1 rounded hover:bg-gray-100'
          } disabled:opacity-50`}
          title="Flag this content"
        >
          🚩 {!compact && 'Flag'}
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            ></div>

            {/* Menu */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-2 text-gray-800">Flag this content</h3>
                
                <button
                  onClick={() => handleFlag('spam_scam')}
                  disabled={flagging}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 mb-2 disabled:opacity-50"
                >
                  <div className="font-medium text-sm text-red-700">🚨 Scam or Spam</div>
                  <div className="text-xs text-gray-600">
                    Tuk-tuk scams, touts, or suspicious phone numbers
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Requires 100 rep to review</div>
                </button>

                <button
                  onClick={() => handleFlag('outdated')}
                  disabled={flagging}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <div className="font-medium text-sm text-orange-700">📅 Outdated Information</div>
                  <div className="text-xs text-gray-600">
                    Prices, schedules, or facts that are no longer accurate
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Requires 500 rep to review</div>
                </button>

                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Flagging sends this to the community review queue. False flags may affect your reputation.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
