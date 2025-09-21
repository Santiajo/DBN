"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import Text from "@/components/Text";
import ParchmentTitle from '@/components/ParchmentTitle';
import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault(); // Evita el refresh de la página

    // Aquí luego puedes validar el login contra el backend
    console.log("Login exitoso ");
    router.push("/home"); 
  };

  return (
    <div className="dbn-pub-home-container dbn-background">
      <ParchmentTitle />
      <div className="dbn-parchment-card">
        <h1 className="dbn-parchment-title">Iniciar Sesión</h1>
        <form className="form dbn-flex-center" onSubmit={handleLogin}>
          <input type="email" placeholder="Correo electrónico" className="dbn-input" required />
          <input type="password" placeholder="Contraseña" className="dbn-input" required />
          <Button type="submit">Entrar</Button>
        </form>
        <p className="dbn-parchment-text">
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
}
