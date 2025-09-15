"use client";

import "@/styles/globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Text from "@/components/Text";
import ParchmentTitle from '@/components/ParchmentTitle';
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/login" || pathname === "/register" || pathname ==="/";

  return (
    <html lang="es">
      <body>
        <main>
        <div className="dbn-homepage-container dbn-background">
        {!hideNavbar && <Navbar />}
        {children}
        </div>
        </main>
        {/* Navbar global */}
        {/* <nav className="flex items-center justify-between bg-blue-600 text-white px-6 py-4">
          <h1 className="text-lg font-bold">DBN Proyecto</h1>
          <ul className="flex gap-6">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:underline">
                Register
              </Link>
            </li>
          </ul>
        </nav> */}

        {/* Contenido de cada página */}

        {/* Footer global */}
        {/* <footer className="bg-gray-200 text-center text-sm py-4 mt-10">
          © 2025 DBN - Todos los derechos reservados
        </footer> */}
      </body>
    </html>
  );
}
