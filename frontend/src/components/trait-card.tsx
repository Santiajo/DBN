import React from 'react';
import Card from './card';

type TraitCardProps = {
  title: string;
  children: React.ReactNode;
  color?: 'bosque' | 'carmesi' | 'sky' | 'yellow' | 'stone'; // Para variar el color del título
  className?: string;
};

export default function TraitCard({
  title,
  children,
  color = 'bosque', // Por defecto verde bosque
  className = '',
}: TraitCardProps) {
  
  // Mapas de colores para el título
  const titleColors = {
    bosque: 'text-bosque',
    carmesi: 'text-carmesi',
    sky: 'text-sky-600',
    yellow: 'text-yellow-600',
    stone: 'text-stone-800',
  };

  return (
    // Usamos tu Card base, pero ajustamos el padding a p-4 para items de lista
    <Card variant="secondary" className={`p-4 ${className}`}>
      <h4 className={`font-bold mb-1 text-lg ${titleColors[color]}`}>
        {title}
      </h4>
      <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </Card>
  );
}