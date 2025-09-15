"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  return (
    <nav className="dbn-parchment-nav">
      <ul className="dbn-nav-list">
        <li>
          <Link href="/home">Panel de Jugadores</Link>
        </li>
        
        <li 
          className="dbn-dropdown"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <span className="cursor-pointer">Tiempo libre ▾</span>
          {isDropdownOpen && (
            <ul className="dbn-dropdown-menu">
              <li><Link href="/jobs">Buscar trabajos</Link></li>
              <li><Link href="/party">Irse de juerga</Link></li>
            </ul>
          )}
        </li>

        <li>
          <Link href="/shops">Tiendas</Link>
        </li>
        
        <li>
          <Link href="/treasure">Puntos de Tesoro</Link>
        </li>

        <li 
          className="dbn-dropdown"
          onMouseEnter={() => setIsAccountOpen(true)}
          onMouseLeave={() => setIsAccountOpen(false)}
        >
          <span className="cursor-pointer">Cuenta ▾</span>
          {isAccountOpen && (
            <ul className="dbn-dropdown-menu">
              <li><Link href="/account">Ver cuenta</Link></li>
              <li><Link href="/">Cerrar sesión</Link></li>
            </ul>
          )}
        </li>

      </ul>
    </nav>
  );
}