'use client';

import { useState } from 'react';
import Link from 'next/link';

import { FaDragon } from 'react-icons/fa';

import PageLayout from "@/components/page-layout";
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";

export default function RegisterPage() {
  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Estados para mensajes de error, éxito y carga
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false); // <-- Estado de carga

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true); // <-- Activar carga

    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      setIsLoading(false); // <-- Desactivar carga si hay error
      return;
    }

    // Enviar datos al backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      // Manejar respuesta del servidor
      if (res.ok) {
        setSuccess('¡Registro exitoso! Revisa tu correo para activar tu cuenta.');
      } else {
        const data = await res.json();
        const errorMessages = Object.values(data).join(' ');
        setError(errorMessages || 'Ocurrió un error en el registro.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setIsLoading(false); // Desactivar carga al finalizar
    }
  };

  return (
    <PageLayout backgroundImage="/backgrounds/4dxdhy6aml6b1.jpg">
      <div className="w-full max-w-lg">
        {/* Caja del Título Superior */}
        <Card variant="primary" className="text-center mb-6">
          <h1 className="font-title text-3xl text-madera-oscura">
            DRAGÓN DEL BASTIÓN DEL NORTE
          </h1>
          <p className="font-body text-sm uppercase tracking-widest text-stone-700 mt-1">
            WEST MARCH
          </p>
        </Card>
        <Card variant="secondary">
          <div className="p-4">
            <h2 className="font-title text-2xl text-center text-madera-oscura mb-6">
              REGISTRO
            </h2>

            {success ? (
              <div className="text-center font-body">
                <FaDragon className="text-5xl text-bosque mx-auto mb-4" />
                <p className="text-madera-oscura">{success}</p>
                <Link href="/login" className="font-bold text-bosque hover:underline mt-4 block">
                  Ir a Iniciar Sesión
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Inputs de nombre y apellido */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1"><Input type="text" placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                  <div className="flex-1"><Input type="text" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                </div>

                {/* Inputs individuales */}
                <Input type="text" placeholder="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <Input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />

                {/* Inputs de contraseña */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1"><Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                  <div className="flex-1"><Input type="password" placeholder="Repetir contraseña" value={password2} onChange={(e) => setPassword2(e.target.value)} required /></div>
                </div>

                {error && <p className="text-sm text-carmesi font-body">{error}</p>}

                <div className="pt-4">
                  <Button variant="primary" type="submit" className="w-full" isLoading={isLoading}>
                    Crear cuenta
                  </Button>
                </div>
              </form>
            )}

            {!success && (
              <div className="text-center mt-6">
                <p className="font-body text-sm text-stone-700">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="font-bold text-bosque hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}