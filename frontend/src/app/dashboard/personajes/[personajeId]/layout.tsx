import CharacterNavbar from '@/components/character-navbar';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    personajeId: string;
  }>;
}

export default async function PersonajeLayout({ children, params }: LayoutProps) {
  const { personajeId } = await params;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 1. Navbar (Tapa de la carpeta / Pestañas) */}
      <CharacterNavbar personajeId={personajeId} />

      {/* 2. Contenido (Hoja de papel) */}
      {/* Borde sólido de madera, fondo blanco, esquinas inferiores redondeadas */}
      <div className="bg-white min-h-[600px] rounded-b-xl border border-madera-oscura p-8 relative">
        {children}
      </div>
    </div>
  );
}