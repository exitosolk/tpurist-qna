'use client';

import { useEffect, useState } from 'react';
import BadgeIcon from './BadgeIcon';

interface Badge {
  id: number;
  name: string;
  tier: string;
  description: string;
  icon: string;
  awarded_at?: string;
}

interface BadgeProgress {
  id: number;
  name: string;
  tier: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
}

interface BadgeListProps {
  userId?: number; // If provided, fetch badges for specific user. Otherwise use current session user
  showProgress?: boolean; // Show progress bars for incomplete badges
  compact?: boolean; // Compact view for profile sidebar
}

export default function BadgeList({ userId, showProgress = true, compact = false }: BadgeListProps) {
  const [earned, setEarned] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<BadgeProgress[]>([]);
  const [availableBronze, setAvailableBronze] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      const url = userId ? `/api/badges?userId=${userId}` : '/api/badges';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEarned(data.earned || []);
        setProgress(data.progress || []);
        setAvailableBronze(data.availableBronze || []);
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {earned.map((badge) => (
          <BadgeIcon
            key={badge.id}
            name={badge.name}
            icon={badge.icon}
            tier={badge.tier}
            description={badge.description}
            size="sm"
          />
        ))}
        {earned.length === 0 && (
          <p className="text-sm text-gray-500">No badges yet</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earned.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Earned Badges ({earned.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {earned.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center text-center">
                <BadgeIcon
                  name={badge.name}
                  icon={badge.icon}
                  tier={badge.tier}
                  description={badge.description}
                  size="lg"
                />
                <div className="mt-2">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {badge.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(badge.awarded_at!).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress towards badges */}
      {showProgress && progress.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            In Progress
          </h3>
          <div className="space-y-4">
            {progress.map((badge) => (
              <div
                key={badge.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  <BadgeIcon
                    name={badge.name}
                    icon={badge.icon}
                    tier={badge.tier}
                    description={badge.description}
                    size="md"
                    showTooltip={false}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {badge.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {badge.description}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{badge.progress} / {badge.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available badges (not started) */}
      {showProgress && earned.length === 0 && progress.length === 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Bronze Tier Badges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableBronze.map((badge) => (
              <div
                key={badge.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <BadgeIcon
                    name={badge.name}
                    icon={badge.icon}
                    tier={badge.tier}
                    description={badge.description}
                    size="md"
                    showTooltip={false}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {badge.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {badge.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
