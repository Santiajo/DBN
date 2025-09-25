'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaDragon } from 'react-icons/fa'; // Ícono de dragón como placeholder

import PageLayout from '@/components/page-layout';
import Card from '@/components/card';
import Button from '@/components/button';

// Componente para mostrar en caso de éxito
const SuccessComponent = () => (
    <Card variant="primary" className="w-full max-w-md text-center flex flex-col items-center">
        <FaDragon className="text-5xl text-bosque mb-4" />
        <h1 className="font-title text-3xl mb-4">CUENTA ACTIVADA</h1>
        <p className="font-body text-base mb-6">
            ¡Tu cuenta en DRAGÓN DEL BASTIÓN DEL NORTE ha sido activada con éxito!
            Ahora puedes explorar el mundo de WEST MARCH.
        </p>
        <Link href="/login" className="w-full">
            <Button variant="primary" className="w-full">
                Iniciar sesión
            </Button>
        </Link>
        <p className="font-body text-xs text-stone-600 mt-4">
            Si no realizaste este registro, puedes ignorar este mensaje.
        </p>
    </Card>
);

// Componente para mostrar en caso de error
const ErrorComponent = ({ message }: { message: string }) => (
    <Card variant="primary" className="w-full max-w-md text-center flex flex-col items-center">
        <FaDragon className="text-5xl text-carmesi mb-4" />
        <h1 className="font-title text-3xl mb-4 text-carmesi">Error en Activación</h1>
        <p className="font-body text-base mb-6">{message}</p>
        <Link href="/register">
            <Button variant="primary">Volver al Registro</Button>
        </Link>
    </Card>
);

// --- Componente Principal de la Página ---
export default function ActivatePage({ params }: { params: { uid: string; token: string } }) {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const activateAccount = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                // Hacemos la llamada a tu API de Django para activar la cuenta
                const res = await fetch(`${apiUrl}/api/activate/${params.uid}/${params.token}/`, {
                    method: 'POST',
                });

                if (res.ok) {
                    setStatus('success');
                } else {
                    const data = await res.json();
                    setErrorMessage(data.error || 'El enlace de activación es inválido o ha expirado.');
                    setStatus('error');
                }
            } catch {
                setStatus('error');
                setErrorMessage('Ocurrió un error de red. Por favor, intenta de nuevo.');
            }
        };

        activateAccount();
    }, [params.uid, params.token]);

    return (
        <PageLayout backgroundImage="/backgrounds/4dxdhy6aml6b1.jpg">
            {status === 'loading' && <p className="font-title text-white text-2xl animate-pulse">Activando cuenta...</p>}
            {status === 'success' && <SuccessComponent />}
            {status === 'error' && <ErrorComponent message={errorMessage} />}
        </PageLayout>
    );
}