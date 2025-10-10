'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageLayout from "@/components/page-layout";
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";

export default function LoginPage() {
  const { login, user } = useAuth(); 
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Si ya hay usuario, redirige al dashboard
  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError('Nombre de usuario o contraseña incorrectos');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      login(data.access, data.refresh); // guarda tokens y redirige
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        setError(err.message);
      } else {
        console.error(err);
        setError('Error de conexión con el servidor');
      }
    }

  };

  return (
    <PageLayout backgroundImage="/backgrounds/4dxdhy6aml6b1.jpg">
      <div className="w-full max-w-md mx-auto">
        <Card variant="primary" className="text-center mb-6">
          <h1 className="font-title text-3xl text-madera-oscura">DRAGÓN DEL BASTIÓN DEL NORTE</h1>
          <p className="font-body text-sm uppercase tracking-widest text-stone-700 mt-1">WEST MARCH</p>
        </Card>

        <Card variant="secondary">
          <div className="p-4">
            <h2 className="font-title text-2xl text-center text-madera-oscura mb-6">INICIO DE SESIÓN</h2>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-carmesi">{error}</p>}
              <Button variant="primary" type="submit" isLoading={isLoading} className="w-full">
                Ingresar
              </Button>
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
