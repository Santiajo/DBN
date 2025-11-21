import CharacterNavbar from '@/components/character-navbar';

interface LayoutProps {
    children: React.ReactNode;
    // CORRECCIÓN 1: params ahora es un Promise en Next.js 15+
    params: Promise<{
        personajeId: string;
    }>;
}

// CORRECCIÓN 2: El componente debe ser 'async'
export default async function PersonajeLayout({ children, params }: LayoutProps) {
    // CORRECCIÓN 3: Debemos hacer 'await' para obtener el ID real
    const { personajeId } = await params;

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* 1. La Barra de Navegación (Persistente) */}
            <CharacterNavbar personajeId={personajeId} />

            {/* 2. El Contenedor del Contenido */}
            <div className="bg-white min-h-[600px] rounded-b-xl border-x border-b border-madera-oscura/20 shadow-sm p-6">
                {children}
            </div>
        </div>
    );
}