import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onRemove,
}) => {
  const baseClass = 'inline-flex items-center gap-1 rounded-full font-medium transition-colors duration-200';

  const variantClass = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
    outline: 'border-2 border-blue-600 text-blue-600 bg-transparent',
  }[variant];

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }[size];

  return (
    <span className={`${baseClass} ${variantClass} ${sizeClass} ${className || ''}`}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70 transition-opacity"
          aria-label="Remove"
        >
          ✕
        </button>
      )}
    </span>
  );
};
