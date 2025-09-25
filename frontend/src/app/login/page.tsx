import PageLayout from "@/components/page-layout"; 
import Card from "@/components/card";
import Input from "@/components/input";
import Button from "@/components/button";

export default function LoginPage() {
  return (
    // Usamos el PageLayout y le pasamos la ruta de la imagen de fondo
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
            
            <form className="space-y-6">
              <div>
                <Input 
                  type="email" 
                  placeholder="Correo electrónico" 
                  aria-label="Correo electrónico"
                />
              </div>
              <div>
                <Input 
                  type="password" 
                  placeholder="Contraseña" 
                  aria-label="Contraseña"
                />
              </div>
              <div>
                <Button variant="primary" type="submit" className="w-full">
                  Ingresar
                </Button>
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="font-body text-sm text-stone-700">
                ¿Aún no tienes cuenta?{' '}
                <a href="#" className="font-bold text-bosque hover:underline">
                  Regístrate
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>

    </PageLayout>
  );
}