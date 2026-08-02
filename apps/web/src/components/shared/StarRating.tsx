import React from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
}

export function StarRating({ rating, max = 5, size = 14, className = '' }: StarRatingProps) {
  const safeRating = typeof rating === 'number' ? rating : 0;
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(max)].map((_, i) => {
        const fillPercentage = Math.max(0, Math.min(100, (safeRating - i) * 100));
        
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            {/* Empty Star */}
            <Star 
              size={size} 
              className="absolute top-0 left-0 text-muted" 
            />
            {/* Filled Star */}
            <div 
              className="absolute top-0 left-0 overflow-hidden" 
              style={{ width: `${fillPercentage}%` }}
            >
              <Star 
                size={size} 
                className="text-yellow-500 fill-yellow-500" 
              />
            </div>
          </div>
        );
      })}
      <span className="text-xs font-medium ml-1 text-muted-foreground">
        {safeRating.toFixed(1)}
      </span>
    </div>
  );
}
