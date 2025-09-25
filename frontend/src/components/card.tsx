// src/components/Card.tsx
import React from 'react';

type CardProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
};

export default function Card({
  children,
  variant = 'primary',
  className = '',
}: CardProps) {
  const baseClasses = "p-6 shadow-lg";

  const variantClasses = {
    primary: 'bg-pergamino rounded-2xl border border-madera-oscura',
    secondary: 'bg-white rounded-xl border border-madera-oscura', // <-- ¡Cambio aquí!
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}