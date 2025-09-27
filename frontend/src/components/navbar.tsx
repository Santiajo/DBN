'use client';

import React from 'react';
import Button from './button';
import { useAuth } from '@/context/AuthContext';

type NavbarProps = {
    pageTitle: string;
    isSidebarCollapsed: boolean; // Estado de la sidebar
};

export default function Navbar({ pageTitle, isSidebarCollapsed }: NavbarProps) {
    // Obtener función logout
    const { logout } = useAuth();

    // Calcular las clases de posición dinámicamente
    const positionClasses = isSidebarCollapsed
        ? 'left-20 w-[calc(100%-5rem)]' // Posición cuando el sidebar está colapsado 
        : 'left-64 w-[calc(100%-16rem)]'; // Posición cuando está expandido

    return (
        <header
            // Insertar las clases calculadas
            className={`fixed top-0 bg-madera-oscura text-white px-6 py-3 flex items-center justify-between shadow-lg z-50 transition-all duration-300 ${positionClasses}`}
        >
            <div>
                <h1 className="font-title text-xl">Dragón del Bastión del Norte</h1>
                <p className="font-body text-xs uppercase tracking-wider text-stone-300">
                    {pageTitle}
                </p>
            </div>
            <Button
                variant="secondary"
                onClick={logout} // Llamar función logout al clickear
                className="hover:bg-carmesi" // Hover rojo
            >
                Cerrar sesión
            </Button>
        </header>
    );
}