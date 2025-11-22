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
  FaUserTie,      // NPCs
  FaUsers,        // Grupos 
  FaCoins,        // Monedas 
  FaGlassCheers,        // Monedas 
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

  // ENLACES
  const mainLinks = [
    { href: '/dashboard', icon: <FaDungeon />, label: 'Inicio' },
    { href: '/dashboard/personajes', icon: <FaUserShield />, label: 'Personajes' },
    { href: '/dashboard/compras', icon: <FaStore />, label: 'Tiendas' },
    { href: '/dashboard/tiendatp', icon: <FaCoins />, label: 'Treasure Points' },
    { href: '/dashboard/juerga', icon: <FaGlassCheers />, label: 'Juerga' },
  ];

  const managementLinks = [
    { href: '/dashboard/objetos', icon: <FaGem />, label: 'Objetos' },
    { href: '/dashboard/especies', icon: <FaDragon />, label: 'Especies' },
    { href: '/dashboard/clases', icon: <FaHatWizard />, label: 'Clases' },
    { href: '/dashboard/subclases', icon: <FaMedal />, label: 'Subclases' },
    { href: '/dashboard/dotes', icon: <FaStar />, label: 'Dotes' },
    { href: '/dashboard/trabajos', icon: <FaHammer />, label: 'Trabajos' },
    { href: '/dashboard/tiendas', icon: <FaBalanceScale />, label: 'Tiendas' },
    { href: '/dashboard/npcs', icon: <FaUserTie />, label: 'NPCs' },
    { href: '/dashboard/grupos', icon: <FaUsers />, label: 'Grupos' },
  ];

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
               ? 'bg-cuero text-white' // Estilo Activo Sólido
               : 'hover:bg-cuero hover:text-white' // Tu hover original
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
      `}
    >
      {/* Título opcional si está expandido (puedes quitarlo si prefieres limpieza total) */}
      {!isCollapsed && (
        <div className="mb-6 px-4 text-center">
           <h1 className="font-title text-xl text-madera-oscura font-bold border-b border-madera-oscura/20 pb-2">GRIMORIO</h1>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="space-y-1"> {/* Espaciado original ajustado */}
          
          {mainLinks.map(link => renderLink(link))}

          {/* Separador sutil */}
          <li className="my-2 border-t border-madera-oscura/20"></li>

          {/* Botón Desplegable de Gestión (Estilo igual a los links) */}
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

      {/* Botón Colapsar (Estilo Original) */}
      <div className="mt-auto pt-4">
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