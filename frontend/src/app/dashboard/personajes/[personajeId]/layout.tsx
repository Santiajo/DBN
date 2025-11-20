import CharacterNavbar from '@/components/character-navbar';

interface LayoutProps {
  children: React.ReactNode;
  params: {
    personajeId: string;
  };
}

export default function PersonajeLayout({ children, params }: LayoutProps) {
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <CharacterNavbar personajeId={params.personajeId} />

      <div className="bg-white min-h-[600px] rounded-b-xl border-x border-b border-madera-oscura/20 shadow-sm p-6">
        {children}
      </div>
    </div>
  );
}