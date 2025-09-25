'use client';

import React from 'react';
import Link from 'next/link';

// íconos de react-icons
import {
  FaHome, FaUserShield, FaRing, FaBed, FaCoins, FaAngleLeft, FaAngleRight
} from 'react-icons/fa';

type SidebarProps = {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
};

// Datos de los enlaces para no repetirlos
const navLinks = [
  { href: '/dashboard', icon: <FaHome />, label: 'Inicio' },
  { href: '/dashboard/personajes', icon: <FaUserShield />, label: 'Personajes' },
  { href: '/dashboard/objetos', icon: <FaRing />, label: 'Objetos' },
  { href: '/dashboard/tiempo-libre', icon: <FaBed />, label: 'Tiempo libre' },
  { href: '/dashboard/economia', icon: <FaCoins />, label: 'Economía' },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <aside
      className={`bg-pergamino border-r border-madera-oscura p-4 flex flex-col shadow-md transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <nav className="flex-1">
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-4 px-4 py-2 rounded-lg hover:bg-cuero hover:text-white transition group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{link.icon}</span>
                {!isCollapsed && <span className="font-body">{link.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex justify-center items-center gap-4 px-4 py-2 rounded-lg hover:bg-cuero hover:text-white transition" // <-- Cambiamos hover:bg-stone-300
        >
          {isCollapsed ? <FaAngleRight className="text-2xl" /> : <FaAngleLeft className="text-2xl" />}
        </button>
      </div>
    </aside>
  );
}