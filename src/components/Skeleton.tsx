import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-800";
  
  const variantClasses = {
    text: "h-3 w-3/4 rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-2xl"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};
