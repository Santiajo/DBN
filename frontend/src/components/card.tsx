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
  // --- INICIO DEL CAMBIO ---
  // Quitamos el borde de las clases base para poder definirlo en cada variante
  const baseClasses = "p-6 shadow-lg";

  // Definimos clases específicas para cada variante, incluyendo el borde
  const variantClasses = {
    primary: 'bg-pergamino rounded-2xl border border-madera-oscura', // Borde añadido aquí
    secondary: 'bg-white rounded-xl border border-stone-300',
  };
  // --- FIN DEL CAMBIO ---

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}