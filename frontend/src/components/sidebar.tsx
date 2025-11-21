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
  FaBook,         // Gestión (Compendio)
  FaGem,          // Objetos
  FaHammer,       // Trabajos
  FaBalanceScale, // Gestión Tiendas (Balanza)
  FaDragon,       // Especies
  FaHatWizard,    // Clases
  FaMedal,        // Subclases
  FaStar,         // Dotes
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

  // Si colapsamos la barra lateral, cerramos el menú de gestión para que se vea limpio (solo iconos)
  // Opcional: Podrías querer que se mantenga abierto, depende del gusto.
  useEffect(() => {
    if (isCollapsed) {
      setIsManagementOpen(false);
    }
  }, [isCollapsed]);

  // Función para manejar el clic en el grupo de gestión
  const toggleManagement = () => {
    if (isCollapsed) {
      // Si está colapsado, primero lo expandimos para ver el contenido
      setIsCollapsed(false);
      setIsManagementOpen(true);
    } else {
      setIsManagementOpen(!isManagementOpen);
    }
  };

  // --- CONFIGURACIÓN DE ENLACES ---
  
  // 1. Enlaces Principales (Jugador / General)
  const mainLinks = [
    { href: '/dashboard', icon: <FaDungeon />, label: 'Inicio' },
    { href: '/dashboard/personajes', icon: <FaUserShield />, label: 'Personajes' },
    { href: '/dashboard/habilidades', icon: <FaScroll />, label: 'Habilidades' }, // Podría ser hechizos/skills
    { href: '/dashboard/compras', icon: <FaStore />, label: 'Tiendas' },
    { href: '/dashboard/tiempo-libre', icon: <FaCampground />, label: 'Tiempo Libre' },
  ];

  // 2. Enlaces de Gestión (Admin / Master)
  const managementLinks = [
    { href: '/dashboard/objetos', icon: <FaGem />, label: 'Objetos' },
    { href: '/dashboard/especies', icon: <FaDragon />, label: 'Especies' },
    { href: '/dashboard/clases', icon: <FaHatWizard />, label: 'Clases' },
    { href: '/dashboard/subclases', icon: <FaMedal />, label: 'Subclases' },
    { href: '/dashboard/dotes', icon: <FaStar />, label: 'Dotes' },
    { href: '/dashboard/trabajos', icon: <FaHammer />, label: 'Trabajos' },
    { href: '/dashboard/tiendas', icon: <FaBalanceScale />, label: 'Gestión Tiendas' },
  ];

  // Helper para renderizar un Link individual
  const renderLink = (link: { href: string; icon: React.ReactNode; label: string }, isSubItem = false) => {
    const isActive = pathname === link.href;
    
    return (
      <li key={link.href}>
        <Link
          href={link.href}
          className={`
            flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative
            ${isActive 
              ? 'bg-cuero text-white shadow-md' // Activo
              : 'text-stone-700 hover:bg-cuero/10 hover:text-cuero' // Inactivo
            }
            ${isSubItem ? 'pl-12 text-sm' : ''} // Indentación para sub-items
          `}
          title={isCollapsed ? link.label : undefined}
        >
          <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {link.icon}
          </span>
          
          {/* Texto (oculto si está colapsado) */}
          {!isCollapsed && (
            <span className="font-body whitespace-nowrap overflow-hidden text-ellipsis">
              {link.label}
            </span>
          )}

          {/* Tooltip flotante cuando está colapsado */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-madera-oscura text-pergamino text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-pergamino">
              {link.label}
            </div>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={`
        bg-pergamino border-r-4 border-madera-oscura/80 flex flex-col transition-all duration-300 shadow-xl
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}
    >
      {/* Logo o Título (Opcional) */}
      <div className={`p-4 border-b border-madera-oscura/20 flex justify-center items-center h-16 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
        {!isCollapsed && <h1 className="font-title text-xl text-madera-oscura font-bold tracking-wider">GRIMORIO</h1>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <ul className="space-y-2 px-2">
          
          {/* Enlaces Principales */}
          {mainLinks.map(link => renderLink(link))}

          {/* Separador */}
          <hr className="border-madera-oscura/20 my-4 mx-2" />

          {/* Grupo de Gestión (Dropdown) */}
          <li>
            <button
              onClick={toggleManagement}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group
                ${isManagementOpen && !isCollapsed ? 'text-madera-oscura font-bold bg-madera-oscura/5' : 'text-stone-600 hover:bg-cuero/5 hover:text-cuero'}
              `}
            >
              <span className="text-xl"><FaBook /></span>
              
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
                ${isManagementOpen && !isCollapsed ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}
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
      <div className="p-4 border-t border-madera-oscura/20 bg-pergamino">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex justify-center items-center p-3 rounded-lg bg-madera-oscura text-pergamino hover:bg-cuero hover:text-white transition-all shadow-sm"
        >
          {isCollapsed ? <FaAngleRight size={20} /> : <FaAngleLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}