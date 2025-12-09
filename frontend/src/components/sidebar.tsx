'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Importamos iconos temáticos de RPG
import {
  FaDungeon,      // Inicio
  FaUserShield,   // Personajes
  FaScroll,       // Habilidades/Hechizos
  FaCampground,   // Tiempo Libre (Descanso)
  FaStore,        // Tiendas (Comprar)
  FaCoins,        // Treasure Points Store
  FaBook,         // Gestión (Compendio)
  FaGem,          // Objetos
  FaHammer,       // Trabajos
  FaBalanceScale, // Gestión Tiendas (Balanza)
  FaDragon,       // Especies
  FaHatWizard,    // Clases
  FaMedal,        // Subclases
  FaStar,         // Dotes
  FaUserTie,      // NPCs
  FaAngleLeft, 
  FaAngleRight, 
  FaChevronDown, 
  FaChevronRight
} from 'react-icons/fa';

type SidebarProps = {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
};

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  
  // Estado para controlar si el menú de gestión está desplegado
  const [isManagementOpen, setIsManagementOpen] = useState(true);

  // Si colapsamos la barra lateral, cerramos el menú de gestión visualmente limpio
  useEffect(() => {
    if (isCollapsed) {
      setIsManagementOpen(false);
    }
  }, [isCollapsed]);

  const toggleManagement = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsManagementOpen(true);
    } else {
      setIsManagementOpen(!isManagementOpen);
    }
  };

  // --- CONFIGURACIÓN DE ENLACES ---
  const mainLinks = [
    { href: '/dashboard', icon: <FaDungeon />, label: 'Inicio' },
    { href: '/dashboard/personajes', icon: <FaUserShield />, label: 'Personajes' },
    { href: '/dashboard/habilidades', icon: <FaScroll />, label: 'Habilidades' },
    { href: '/dashboard/tiendatp', icon: <FaCoins />, label: 'Treasure Points' },
    { href: '/dashboard/compras', icon: <FaStore />, label: 'Tiendas' },
    { href: '/dashboard/tiempo-libre', icon: <FaCampground />, label: 'Tiempo libre' },
  ];

  const managementLinks = [
    { href: '/dashboard/npcs', icon: <FaUserTie />, label: 'NPCs' },
    { href: '/dashboard/objetos', icon: <FaGem />, label: 'Objetos' },
    { href: '/dashboard/especies', icon: <FaDragon />, label: 'Especies' },
    { href: '/dashboard/clases', icon: <FaHatWizard />, label: 'Clases' },
    { href: '/dashboard/subclases', icon: <FaMedal />, label: 'Subclases' },
    { href: '/dashboard/dotes', icon: <FaStar />, label: 'Dotes' },
    { href: '/dashboard/trabajos', icon: <FaHammer />, label: 'Trabajos' },
    { href: '/dashboard/tiendas', icon: <FaBalanceScale />, label: 'Gestión tiendas' },
  ];

  // Helper para renderizar links con TU ESTILO ORIGINAL
  const renderLink = (link: { href: string; icon: React.ReactNode; label: string }, isSubItem = false) => {
    const isActive = pathname === link.href;
    
    return (
      <li key={link.href}>
        <Link
          href={link.href}
          className={`
            flex items-center gap-4 px-4 py-2 rounded-lg transition group relative
            ${isSubItem ? 'pl-8 text-sm' : ''} 
            ${isActive 
               ? 'bg-cuero text-white' 
               : 'hover:bg-cuero hover:text-white'
            }
          `}
          title={isCollapsed ? link.label : undefined}
        >
          <span className={`text-2xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
            {link.icon}
          </span>
          
          {!isCollapsed && (
            <span className="font-body whitespace-nowrap overflow-hidden text-ellipsis">
              {link.label}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={`
        bg-pergamino border-r border-madera-oscura p-4 flex flex-col transition-all duration-300 
        ${isCollapsed ? 'w-20' : 'w-64'}
        h-screen sticky top-0
      `}
    >
      {/* Título opcional */}
      {!isCollapsed && (
        <div className="mb-6 px-4 text-center shrink-0">
           <h1 className="font-title text-xl text-madera-oscura font-bold border-b border-madera-oscura/20 pb-2">GRIMORIO</h1>
        </div>
      )}

      {/* NAVEGACIÓN SCROLLABLE
          Aquí aplicamos las clases para ocultar el scrollbar:
          [&::-webkit-scrollbar]:hidden -> Oculta en Chrome/Safari
          [-ms-overflow-style:none]    -> Oculta en IE/Edge
          [scrollbar-width:none]       -> Oculta en Firefox
      */}
      <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ul className="space-y-1">
          
          {mainLinks.map(link => renderLink(link))}

          <li className="my-2 border-t border-madera-oscura/20"></li>

          {/* Botón Desplegable de Gestión */}
          <li>
            <button
              onClick={toggleManagement}
              className={`
                w-full flex items-center gap-4 px-4 py-2 rounded-lg transition group cursor-pointer
                ${isManagementOpen && !isCollapsed ? 'text-madera-oscura font-bold' : 'hover:bg-cuero hover:text-white'}
              `}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform"><FaBook /></span>
              
              {!isCollapsed && (
                <>
                  <span className="font-body flex-1 text-left">Compendio</span>
                  <span className="text-xs">
                    {isManagementOpen ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                </>
              )}
            </button>

            {/* Lista Desplegable */}
            <div 
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isManagementOpen && !isCollapsed ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'}
              `}
            >
              <ul className="space-y-1">
                {managementLinks.map(link => renderLink(link, true))}
              </ul>
            </div>
          </li>

        </ul>
      </nav>

      {/* Botón Colapsar */}
      <div className="mt-auto pt-4 shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex justify-center items-center gap-4 px-4 py-2 rounded-lg hover:bg-cuero hover:text-white cursor-pointer transition"
        >
          {isCollapsed ? <FaAngleRight className="text-2xl" /> : <FaAngleLeft className="text-2xl" />}
        </button>
      </div>
    </aside>
  );
}