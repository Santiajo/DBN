import React from 'react';

type CardProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
};

export default function Card({
  children,
  variant = 'primary',
  className = '',
  onClick,
}: CardProps) {
  const baseClasses = "p-6";

  const variantClasses = {
    primary: 'bg-pergamino rounded-2xl border border-madera-oscura',
    secondary: 'bg-white rounded-xl border border-madera-oscura',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}