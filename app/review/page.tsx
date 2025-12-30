'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';

interface ReviewQueueItem {
  id: number;
  content_type: string;
  content_id: number;
  review_type: string;
  flagged_by: number;
  flagged_at: string;
  hide_votes: number;
  keep_votes: number;
  flagger_username: string;
  content_preview: string;
  author_username: string;
  user_vote?: string | null;
}

interface QueueData {
  items: ReviewQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  userReputation: number;
  minReputation: number;
}

export default function ReviewQueuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'spam_scam' | 'outdated'>('spam_scam');
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [error, setError] = useState('');
  const [votingId, setVotingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchQueue();
    }
  }, [status, activeTab, page]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/review/queue?reviewType=${activeTab}&page=${page}`);
      const data = await response.json();

      if (!response.ok) {
        // If user doesn't have enough reputation, redirect to home with message
        if (response.status === 403) {
          setToast({
            message: data.error || 'You need more reputation to access the review queue',
            type: 'error'
          });
          setTimeout(() => {
            router.push('/');
          }, 2000);
          return;
        }
        throw new Error(data.error || 'Failed to fetch review queue');
      }

      setQueueData(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewQueueId: number, vote: string) => {
    try {
      setVotingId(reviewQueueId);
      const response = await fetch('/api/review/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewQueueId, vote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record vote');
      }

      setToast({
        message: 'Vote recorded successfully! +1 reputation earned.',
        type: 'success'
      });

      // Refresh the queue
      await fetchQueue();
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to record vote. Please try again.',
        type: 'error'
      });
    } finally {
      setVotingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const getVoteButtons = (item: ReviewQueueItem) => {
    if (item.review_type === 'spam_scam') {
      return (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleVote(item.id, 'hide')}
            disabled={votingId === item.id || item.user_vote !== null}
            className={`px-4 py-2 rounded ${
              item.user_vote === 'hide'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            } disabled:opacity-50`}
          >
            Hide (Spam/Scam)
          </button>
          <button
            onClick={() => handleVote(item.id, 'keep')}
            disabled={votingId === item.id || item.user_vote !== null}
            className={`px-4 py-2 rounded ${
              item.user_vote === 'keep'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
          >
            Keep (Looks OK)
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleVote(item.id, 'outdated')}
            disabled={votingId === item.id || item.user_vote !== null}
            className={`px-4 py-2 rounded ${
              item.user_vote === 'outdated'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            } disabled:opacity-50`}
          >
            Mark as Outdated
          </button>
          <button
            onClick={() => handleVote(item.id, 'current')}
            disabled={votingId === item.id || item.user_vote !== null}
            className={`px-4 py-2 rounded ${
              item.user_vote === 'current'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
          >
            Still Current
          </button>
        </div>
      );
    }
  };

  const getContentLink = (item: ReviewQueueItem) => {
    if (item.content_type === 'question') {
      return `/questions/${item.content_id}`;
    } else if (item.content_type === 'answer') {
      // You'll need to fetch the question_id for the answer
      return `/questions/${item.content_id}`; // This is simplified
    }
    return '#';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Community Review Queue</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">How it works</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Scam & Spam Patrol (100+ rep):</strong> Help identify and hide scams, touts, and spam
            </li>
            <li>
              <strong>Fact Checker (500+ rep):</strong> Mark outdated information that might mislead tourists
            </li>
            <li>Earn +1 rep for each review, +2 bonus if you agree with community consensus</li>
            <li>3 votes needed to take action on flagged content</li>
          </ul>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => {
              setActiveTab('spam_scam');
              setPage(1);
            }}
            className={`pb-2 px-4 ${
              activeTab === 'spam_scam'
                ? 'border-b-2 border-blue-500 font-semibold'
                : 'text-gray-600'
            }`}
          >
            🚨 Scam & Spam Patrol
            {queueData?.userReputation && queueData.userReputation >= 100 && (
              <span className="ml-2 text-sm">
                ({queueData.pagination.total} items)
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('outdated');
              setPage(1);
            }}
            className={`pb-2 px-4 ${
              activeTab === 'outdated'
                ? 'border-b-2 border-blue-500 font-semibold'
                : 'text-gray-600'
            }`}
          >
            📅 Fact Checker
            {queueData?.userReputation && queueData.userReputation >= 500 && (
              <span className="ml-2 text-sm">
                ({queueData.pagination.total} items)
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {queueData && (
          <>
            {queueData.items.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">
                <p className="text-lg">🎉 All caught up! No items in the review queue.</p>
                <p className="mt-2">Check back later or help flag problematic content.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queueData.items.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {item.content_type}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          Flagged by{' '}
                          <Link
                            href={`/users/${item.flagger_username}`}
                            className="text-blue-600 hover:underline"
                          >
                            {item.flagger_username}
                          </Link>{' '}
                          on {new Date(item.flagged_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Votes: {item.hide_votes} hide / {item.keep_votes} keep
                        </div>
                        {item.user_vote && (
                          <div className="text-xs text-green-600 font-semibold mt-1">
                            You voted: {item.user_vote}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded mb-3">
                      <p className="text-gray-700 line-clamp-3">{item.content_preview}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Author:{' '}
                        <Link
                          href={`/users/${item.author_username}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.author_username}
                        </Link>
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <Link
                        href={getContentLink(item)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View full content →
                      </Link>
                      {getVoteButtons(item)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {queueData.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {queueData.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === queueData.pagination.totalPages}
                  className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
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
    </div>
  );
}
