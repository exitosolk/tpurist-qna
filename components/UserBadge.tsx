import Link from "next/link";
import Image from "next/image";

interface BadgeTierCounts {
  bronze: number;
  silver: number;
  gold: number;
}

interface UserBadgeProps {
  username: string;
  displayName: string;
  avatarUrl?: string;
  reputation: number;
  badgeCounts?: BadgeTierCounts;
  size?: "small" | "medium" | "large";
}

export default function UserBadge({
  username,
  displayName,
  avatarUrl,
  reputation,
  badgeCounts,
  size = "medium",
}: UserBadgeProps) {
  const sizeClasses = {
    small: { avatar: "w-5 h-5", text: "text-xs" },
    medium: { avatar: "w-6 h-6", text: "text-xs sm:text-sm" },
    large: { avatar: "w-8 h-8", text: "text-sm" },
  };

  const { avatar: avatarSize, text: textSize } = sizeClasses[size];

  const hasAnyBadges = badgeCounts && (badgeCounts.bronze > 0 || badgeCounts.silver > 0 || badgeCounts.gold > 0);

  return (
    <div className={`flex items-center gap-2 ${textSize} text-gray-500`}>
      {/* Avatar or Initial */}
      {avatarUrl ? (
        <div className={`${avatarSize} rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}>
          <Image
            src={avatarUrl}
            alt={displayName || username}
            width={size === "large" ? 32 : size === "medium" ? 24 : 20}
            height={size === "large" ? 32 : size === "medium" ? 24 : 20}
            className="object-cover"
          />
        </div>
      ) : (
        <div className={`${avatarSize} bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0`}>
          {(displayName || username).charAt(0).toUpperCase()}
        </div>
      )}

      {/* User Info */}
      <span>
        <Link
          href={`/users/${username}`}
          className="text-blue-600 font-medium hover:text-blue-800"
        >
          {displayName || username}
        </Link>
        <span className="text-gray-400 mx-1">•</span>
        <span>{reputation} rep</span>

        {/* Badge Counts */}
        {hasAnyBadges && (
          <>
            <span className="text-gray-400 mx-1">•</span>
            <span className="inline-flex items-center gap-1.5">
              {badgeCounts.gold > 0 && (
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-0.5"></span>
                  <span className="font-medium">{badgeCounts.gold}</span>
                </span>
              )}
              {badgeCounts.silver > 0 && (
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-400 mr-0.5"></span>
                  <span className="font-medium">{badgeCounts.silver}</span>
                </span>
              )}
              {badgeCounts.bronze > 0 && (
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-700 mr-0.5"></span>
                  <span className="font-medium">{badgeCounts.bronze}</span>
                </span>
              )}
            </span>
          </>
        )}
      </span>
    </div>
  );
}
