"use client";

import Button from "@/components/Button";
import Text from "@/components/Text";
import Link from "next/link";

import ParchmentTitle from '@/components/ParchmentTitle';

export default function Home() {
  return (
    <div className="dbn-pub-home-container dbn-background">
      <ParchmentTitle />
      
      <div className="dbn-parchment-card">
        <p className="dbn-parchment-text">Selecciona una opción para continuar</p>

        <div className="dbn-home-buttons">
          <Link href="/login">
            <button className="dbn-parchment-button">INICIAR SESIÓN</button>
          </Link>

          <Link href="/register">
            <button className="dbn-parchment-button">REGISTRARSE</button>
          </Link>
        </div>
      </div>
    </div>
  );
}