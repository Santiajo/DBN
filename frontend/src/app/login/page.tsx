'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLayout from "@/components/page-layout"; 
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Guardar tokens en el almacenamiento local del navegador
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // Redirigir al dashboard
        router.push('/dashboard');
      } else {
        setError('Las credenciales son incorrectas.');
      }
    } catch (err) {
      setError('Ocurrió un error de red. Intenta de nuevo.');
    }
  };

  return (
    <PageLayout backgroundImage="/backgrounds/4dxdhy6aml6b1.jpg">
      
      <div className="w-full max-w-md">

        {/* Caja del Título Superior */}
        <Card variant="primary" className="text-center mb-6">
          <h1 className="font-title text-3xl text-madera-oscura">
            DRAGÓN DEL BASTIÓN DEL NORTE
          </h1>
          <p className="font-body text-sm uppercase tracking-widest text-stone-700 mt-1">
            WEST MARCH
          </p>
        </Card>

        {/* Tarjeta del Formulario de Login */}
        <Card variant="secondary">
          <div className="p-4">
            <h2 className="font-title text-2xl text-center text-madera-oscura mb-6">
              INICIO DE SESIÓN
            </h2>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input 
                  type="text" 
                  placeholder="Nombre de usuario" 
                  aria-label="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <Input 
                  type="password" 
                  placeholder="Contraseña" 
                  aria-label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-carmesi">{error}</p>}
              <div>
                <Button variant="primary" type="submit" className="w-full">
                  Ingresar
                </Button>
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="font-body text-sm text-stone-700">
                ¿Aún no tienes cuenta?{' '}
                <Link href="/registro" className="font-bold text-bosque hover:underline">
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>

    </PageLayout>
  );
}