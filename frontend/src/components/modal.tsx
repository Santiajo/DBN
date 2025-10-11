'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import Card from './card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    // CAMBIO: Esta función previene el scroll del body cuando el modal está abierto.
    // Esto elimina la barra blanca y el desplazamiento de fondo.
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function para restaurar el scroll si el componente se desmonta
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-4"
        onClick={(e) => e.stopPropagation()} // Evita que el click dentro del modal lo cierre
      >
        <Card variant="secondary">
          <div className="flex justify-between items-center p-4 border-b border-[#6B4226]">
            <h2 className="font-title text-xl text-madera-oscura">{title}</h2>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <X size={24} />
            </button>
          </div>
          {/* CAMBIO: Se aplica la clase de scroll personalizado y un max-height */}
          <div className="p-6 overflow-y-auto scrollbar-custom" style={{ maxHeight: '80vh' }}>
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
}