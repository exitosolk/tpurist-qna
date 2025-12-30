'use client';

interface ContentFlagWarningProps {
  flagType: 'hidden_spam' | 'outdated';
  compact?: boolean;
}

export default function ContentFlagWarning({ flagType, compact = false }: ContentFlagWarningProps) {
  if (flagType === 'hidden_spam') {
    return (
      <div className={`bg-red-50 border-l-4 border-red-500 ${compact ? 'p-2' : 'p-4'} mb-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-red-800`}>
              Hidden by Community
            </h3>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-red-700 mt-1`}>
              This content was flagged by the community as spam or a potential scam. 
              {!compact && ' Exercise caution and verify information independently.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (flagType === 'outdated') {
    return (
      <div className={`bg-orange-50 border-l-4 border-orange-500 ${compact ? 'p-2' : 'p-4'} mb-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-orange-500 text-xl">📅</span>
          </div>
          <div className="ml-3">
            <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-orange-800`}>
              Possibly Outdated
            </h3>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-orange-700 mt-1`}>
              The community has marked this information as potentially outdated. 
              {!compact && ' Please verify current prices, schedules, or details before relying on this answer.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
