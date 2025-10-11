'use client';

import { useEffect } from 'react';
import Card from './card';
import Button from './button';

interface ConfirmAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmAlert({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Sí, eliminar",
  cancelText = "Cancelar",
}: ConfirmAlertProps) {
  
  // Previene el scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // Efecto de blur
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="secondary">
          <div className="p-8 text-center">
            {/* Título */}
            <h2 className="font-title text-3xl text-madera-oscura mb-4">
              {title}
            </h2>
            
            {/* Mensaje */}
            <p className="font-body text-base text-stone-700 mb-8">
              {message}
            </p>

            {/* Botones de acción */}
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={onClose}>
                {cancelText}
              </Button>
              <Button variant="dangerous" onClick={onConfirm}>
                {confirmText}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}