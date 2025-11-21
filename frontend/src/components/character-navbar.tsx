'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaUser, 
  FaBoxOpen, 
  FaScroll, 
  FaBolt, 
  FaBook, 
  FaArrowLeft 
} from 'react-icons/fa';

interface CharacterNavbarProps {
  personajeId: string;
}

export default function CharacterNavbar({ personajeId }: CharacterNavbarProps) {
  const pathname = usePathname();
  const baseUrl = `/dashboard/personajes/${personajeId}`;

  // Definimos las pestañas de navegación
  const tabs = [
    { name: 'General', path: '', icon: <FaUser /> }, // La raíz es el resumen
    { name: 'Inventario', path: '/inventario', icon: <FaBoxOpen /> },
    { name: 'Rasgos', path: '/rasgos', icon: <FaBolt /> }, // Futura implementación
    { name: 'Hechizos', path: '/hechizos', icon: <FaScroll /> }, // Futura implementación
    { name: 'Diario', path: '/diario', icon: <FaBook /> }, // Futura implementación
  ];

  return (
    <nav className="bg-madera-oscura rounded-t-xl shadow-lg border-b-4 border-cuero overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center px-4">
        
        {/* Botón para salir al listado general */}
        <Link 
          href="/dashboard/personajes" 
          className="flex items-center gap-2 text-pergamino/70 hover:text-white py-3 text-xs uppercase tracking-wider transition-colors"
        >
          <FaArrowLeft /> Mis Personajes
        </Link>

        {/* Lista de Pestañas */}
        <ul className="flex flex-wrap justify-center gap-1 w-full md:w-auto">
          {tabs.map((tab) => {
            const fullPath = `${baseUrl}${tab.path}`;
            
            // Lógica para determinar si está activo
            // El caso base ('') debe ser exacto, los otros pueden ser parciales si hay sub-rutas
            const isActive = tab.path === '' 
              ? pathname === baseUrl
              : pathname.startsWith(fullPath);

            return (
              <li key={tab.name}>
                <Link
                  href={fullPath}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-title transition-all duration-200
                    ${isActive 
                      ? 'bg-pergamino text-madera-oscura font-bold clip-path-tab' // Activo: Parece una hoja de papel
                      : 'text-pergamino hover:bg-white/10 hover:text-white' // Inactivo
                    }
                  `}
                >
                  <span className={isActive ? 'text-bosque' : 'opacity-70'}>
                    {tab.icon}
                  </span>
                  <span>{tab.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}