'use client';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'live' | 'upcoming' | 'ended';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({
  status,
  children,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  const statusClasses = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    pending: 'bg-gray-100 text-gray-700',
    live: 'bg-red-100 text-red-700 animate-pulse',
    upcoming: 'bg-blue-100 text-blue-700',
    ended: 'bg-gray-100 text-gray-700'
  };
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${statusClasses[status]} ${className}`;
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
}
