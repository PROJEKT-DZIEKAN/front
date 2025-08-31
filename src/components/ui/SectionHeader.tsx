'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  icon,
  title,
  subtitle,
  action,
  className = ''
}: SectionHeaderProps) {
  return (
    <div className={`text-center ${className}`}>
      {icon && (
        <div className="mb-4">
          {icon}
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      {subtitle && (
        <p className="text-gray-600 mb-4">{subtitle}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
