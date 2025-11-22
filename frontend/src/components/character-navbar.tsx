'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaUser, 
  FaBoxOpen, 
  FaArrowLeft,
  FaHandshake 
} from 'react-icons/fa';

interface CharacterNavbarProps {
  personajeId: string;
}

export default function CharacterNavbar({ personajeId }: CharacterNavbarProps) {
  const pathname = usePathname();
  const baseUrl = `/dashboard/personajes/${personajeId}`;

  // Definimos las pestañas
  const tabs = [
    { name: 'General', path: '', icon: <FaUser /> }, 
    { name: 'Inventario', path: '/inventario', icon: <FaBoxOpen /> },
    { name: 'Relaciones', path: '/relaciones', icon: <FaHandshake /> },
  ];

  return (
    <nav className="flex flex-col md:flex-row justify-between items-end px-4 pt-4 bg-pergamino border-x border-t border-madera-oscura rounded-t-xl">
      
      {/* Botón "Salir" estilizado como enlace de texto clásico */}
      <Link 
        href="/dashboard/personajes" 
        className="flex items-center gap-2 text-madera-oscura/70 hover:text-carmesi mb-3 md:mb-2 px-2 transition-colors font-title text-sm font-bold uppercase tracking-widest group"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
        <span>Mis Personajes</span>
      </Link>

      {/* Pestañas Estilo "Folder" Físico */}
      <ul className="flex flex-wrap justify-center gap-1 w-full md:w-auto -mb-[2px]"> 
        {tabs.map((tab) => {
          const fullPath = `${baseUrl}${tab.path}`;
          // Coincidencia exacta para la raíz, parcial para el resto
          const isActive = tab.path === '' 
              ? pathname === baseUrl
              : pathname.startsWith(fullPath);

          return (
            <li key={tab.name}>
              <Link
                href={fullPath}
                className={`
                  group flex items-center gap-2 px-5 py-2 rounded-t-lg border-x border-t font-title text-sm tracking-wide transition-all
                  ${isActive 
                    ? 'bg-white border-madera-oscura text-madera-oscura relative z-10 border-b-white pb-3 -mb-1' // Activo: Blanco, se fusiona abajo, tapa el borde inferior
                    : 'bg-madera-oscura/5 border-transparent text-stone-600 hover:bg-madera-oscura/10 hover:text-madera-oscura border-b border-b-madera-oscura' // Inactivo: Hundido
                  }
                `}
              >
                <span className={`text-base ${isActive ? 'text-bosque' : 'opacity-50 group-hover:opacity-100'}`}>
                  {tab.icon}
                </span>
                <span className={isActive ? 'font-bold' : ''}>{tab.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}