import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  clickable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  clickable = false,
  onClick,
}) => {
  const hoverClass = clickable ? 'hover:shadow-md cursor-pointer transition-shadow duration-200' : '';

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${hoverClass} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
