import PageLayout from "@/components/page-layout"; 
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";
import Link from 'next/link';

export default function RegisterPage() {
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

        {/* Tarjeta del Formulario de Registro */}
        <Card variant="secondary">
          <div className="p-4">
            <h2 className="font-title text-2xl text-center text-madera-oscura mb-6">
              REGISTRO
            </h2>
            
            <form className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input 
                    type="text" 
                    placeholder="Nombre"
                    aria-label="Nombre"
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    type="text" 
                    placeholder="Apellido"
                    aria-label="Apellido"
                  />
                </div>
              </div>

              {/* Campos de ancho completo */}
              <Input 
                type="text" 
                placeholder="Nombre de usuario" 
                aria-label="Nombre de usuario"
              />
              <Input 
                type="email" 
                placeholder="Correo" 
                aria-label="Correo"
              />

              {/* Fila para Contraseña y Repetir Contraseña */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input 
                    type="password"
                    placeholder="Contraseña"
                    aria-label="Contraseña"
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    type="password"
                    placeholder="Repetir contraseña"
                    aria-label="Repetir contraseña"
                  />
                </div>
              </div>

              {/* Botón de envío */}
              <div className="pt-4">
                <Button variant="primary" type="submit" className="w-full">
                  Crear cuenta
                </Button>
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="font-body text-sm text-stone-700">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="font-bold text-bosque hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>

    </PageLayout>
  );
}