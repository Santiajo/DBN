'use client';

import { useEffect, useRef } from 'react';
import Card from './card';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      {/* --- CAMBIO AQUÍ --- */}
      {/* Se usa la clase 'custom-scrollbar' que creamos en globals.css */}
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <Card variant="primary" className="p-0">
          <div className="flex justify-between items-center p-4 border-b border-[#6B4226]">
            <h2 className="font-title text-2xl text-madera-oscura">{title}</h2>
            <button onClick={onClose} className="text-stone-500 hover:text-carmesi">
              <FaTimes size={20} />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
}

