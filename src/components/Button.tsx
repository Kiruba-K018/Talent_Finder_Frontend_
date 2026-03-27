import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  'aria-hidden'?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ariaLabel,
  ...props
}) => {
  const baseClass =
    'font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClass = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  }[variant];

  const sizeClass = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }[size];

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className || ''}`}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" aria-hidden={true} />}
      {children}
    </button>
  );
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', 'aria-hidden': ariaHidden }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div
      className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-hidden={ariaHidden}
      aria-label="Loading"
    />
  );
};
