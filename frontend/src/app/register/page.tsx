"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import Text from "@/components/Text";
import ParchmentTitle from '@/components/ParchmentTitle';

export default function RegisterPage() {
  return (
   <div className="dbn-pub-home-container dbn-background">
      <ParchmentTitle />
      <div className="dbn-parchment-card">
        <h1 className="dbn-parchment-title">Registro</h1>
        <form className="form dbn-flex-center">
          <input type="text" placeholder="Nombre completo" className="dbn-input" />
          <input type="email" placeholder="Correo electrónico" className="dbn-input" />
          <input type="password" placeholder="Contraseña" className="dbn-input" />
          <Button  type="submit">Crear cuenta</Button>
        </form>
        <p className="link-text">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}
