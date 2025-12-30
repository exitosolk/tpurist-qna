'use client';

interface BadgeIconProps {
  name: string;
  icon: string;
  tier: string;
  description: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function BadgeIcon({
  name,
  icon,
  tier,
  description,
  size = 'md',
  showTooltip = true
}: BadgeIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xl',
    md: 'w-12 h-12 text-3xl',
    lg: 'w-16 h-16 text-4xl'
  };

  const tierColors = {
    bronze: 'bg-amber-100 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700',
    silver: 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
    gold: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700'
  };

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]} 
          ${tierColors[tier as keyof typeof tierColors] || tierColors.bronze}
          rounded-full border-2 flex items-center justify-center
          shadow-sm hover:shadow-md transition-shadow cursor-pointer
        `}
      >
        <span>{icon}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-300 mt-1 max-w-xs whitespace-normal">
            {description}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
