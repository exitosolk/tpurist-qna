"use client";

import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface TagBadgeProps {
  tier: 'bronze' | 'silver' | 'gold';
  tagName: string;
  isActive?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TagBadge: React.FC<TagBadgeProps> = ({ 
  tier, 
  tagName, 
  isActive = true, 
  showTooltip = true,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const badgeColors = {
    bronze: isActive ? '#CD7F32' : '#B8B8B8',
    silver: isActive ? '#C0C0C0' : '#B8B8B8',
    gold: isActive ? '#FFD700' : '#B8B8B8'
  };

  const badgeStyles = {
    bronze: isActive 
      ? 'bg-gradient-to-br from-orange-400 to-orange-600' 
      : 'bg-gradient-to-br from-gray-300 to-gray-400',
    silver: isActive 
      ? 'bg-gradient-to-br from-gray-200 to-gray-400' 
      : 'bg-gradient-to-br from-gray-300 to-gray-400',
    gold: isActive 
      ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600' 
      : 'bg-gradient-to-br from-gray-300 to-gray-400'
  };

  const tooltipText = {
    bronze: `Explorer in ${tagName}${!isActive ? ' (inactive)' : ''}`,
    silver: `Guide in ${tagName}${!isActive ? ' (inactive)' : ''}`,
    gold: `Expert in ${tagName}${!isActive ? ' (inactive - needs activity)' : ''}`
  };

  return (
    <div className="inline-flex items-center gap-1 group relative">
      {/* Badge Icon */}
      <div 
        className={`
          ${sizeClasses[size]} 
          ${badgeStyles[tier]}
          rounded-full 
          flex items-center justify-center 
          shadow-sm
          border border-white/20
          ${!isActive ? 'opacity-50' : ''}
        `}
        title={showTooltip ? tooltipText[tier] : undefined}
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-2/3 h-2/3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {/* Star/Badge icon */}
          <path 
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="currentColor"
            className={isActive ? 'text-white/90' : 'text-gray-500'}
          />
        </svg>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
          px-2 py-1 
          bg-gray-900 text-white text-xs rounded 
          whitespace-nowrap 
          opacity-0 group-hover:opacity-100 
          pointer-events-none 
          transition-opacity duration-200
          z-10
        ">
          {tooltipText[tier]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

interface TagBadgeListProps {
  badges: Array<{
    tier: 'bronze' | 'silver' | 'gold';
    tagName: string;
    isActive: boolean;
    earnedAt: Date;
  }>;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const TagBadgeList: React.FC<TagBadgeListProps> = ({ 
  badges, 
  maxDisplay = 5,
  size = 'md'
}) => {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayBadges.map((badge, index) => (
        <div key={index} className="flex items-center gap-1">
          <TagBadge 
            tier={badge.tier}
            tagName={badge.tagName}
            isActive={badge.isActive}
            size={size}
          />
          <span className="text-sm text-gray-700">{badge.tagName}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-gray-500">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

interface TagBadgeCardProps {
  tier: 'bronze' | 'silver' | 'gold';
  tagName: string;
  isActive: boolean;
  score: number;
  acceptedAnswers: number;
  earnedAt: Date;
  lastActivity?: Date;
}

export const TagBadgeCard: React.FC<TagBadgeCardProps> = ({
  tier,
  tagName,
  isActive,
  score,
  acceptedAnswers,
  earnedAt,
  lastActivity
}) => {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const tierLabels = {
    bronze: 'Island Explorer',
    silver: 'Local Guide',
    gold: 'Ceylon Expert'
  };

  const tierEmojis = {
    bronze: '🗺️',
    silver: '🧭',
    gold: '🏆'
  };

  const tierDescriptions = {
    bronze: 'Discovered the path • Helping fellow travelers',
    silver: 'Trusted advisor • Can retag questions',
    gold: 'Master of the island • Single-vote moderation powers'
  };

  const getBadgeShareText = () => {
    const emoji = tierEmojis[tier];
    const label = tierLabels[tier];
    return `${emoji} Just earned the "${label}" badge in #${tagName} on OneCeylon! ${score} points from helping travelers explore Sri Lanka. 🇱🇰\n\nJoin the community: https://oneceylon.space`;
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const shareText = getBadgeShareText();
    const url = 'https://oneceylon.space';

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      return;
    }

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(shareText)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShareMenuOpen(false);
  };

  return (
    <div className={`
      p-4 rounded-lg border-2 
      ${tier === 'gold' && isActive ? 'border-yellow-400 bg-yellow-50' : ''}
      ${tier === 'silver' && isActive ? 'border-gray-300 bg-gray-50' : ''}
      ${tier === 'bronze' && isActive ? 'border-orange-300 bg-orange-50' : ''}
      ${!isActive ? 'border-gray-200 bg-gray-50 opacity-60' : ''}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TagBadge tier={tier} tagName={tagName} isActive={isActive} showTooltip={false} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{tagName}</span>
              {!isActive && (
                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                  Inactive
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <span>{tierEmojis[tier]}</span>
              <span>{tierLabels[tier]} Badge</span>
            </div>
          </div>
        </div>
        
        {/* Share Button */}
        <div className="relative">
          <button
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Share this achievement"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
          
          {/* Share Menu Dropdown */}
          {shareMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <span className="text-blue-400">𝕏</span>
                <span>Share on Twitter</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <span className="text-blue-600">f</span>
                <span>Share on Facebook</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <span className="text-blue-700">in</span>
                <span>Share on LinkedIn</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => handleShare('copy')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-600" /> <span className="text-green-600">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /> <span>Copy to clipboard</span></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {tierDescriptions[tier]}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500">Tag Score</div>
          <div className="font-semibold text-lg">{score}</div>
        </div>
        <div>
          <div className="text-gray-500">Accepted Answers</div>
          <div className="font-semibold text-lg">{acceptedAnswers}</div>
        </div>
        <div>
          <div className="text-gray-500">Earned</div>
          <div className="text-gray-700">
            {new Date(earnedAt).toLocaleDateString()}
          </div>
        </div>
        {lastActivity && (
          <div>
            <div className="text-gray-500">Last Activity</div>
            <div className="text-gray-700">
              {new Date(lastActivity).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {tier === 'gold' && !isActive && (
        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
          <strong>Badge Inactive:</strong> Earn 5+ points in this tag within the next activity period to reactivate.
        </div>
      )}
    </div>
  );
};

export default TagBadge;
