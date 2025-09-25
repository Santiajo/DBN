import Button from "@/components/button";
import Input from "@/components/input";
import Card from "@/components/card";   
import Table from "@/components/table";

const tableHeaders = [
  { key: 'jugador', label: 'Jugador' },
  { key: 'clase', label: 'Clase' },
  { key: 'nivel', label: 'Nivel' },
  { key: 'oro', label: 'Oro' },
];

const tableData = [
  { jugador: 'Eldrin', clase: 'Guerrero', nivel: 3, oro: 120 },
  { jugador: 'Lyra', clase: 'Maga', nivel: 2, oro: 85 },
  { jugador: 'Fendrel', clase: 'Pícaro', nivel: 3, oro: 150 },
  { jugador: 'Seraphina', clase: 'Clériga', nivel: 2, oro: 90 },
];

export default function UIKitPage() {
  return (
    <main className="p-10 space-y-16">
      <section>
        <h2 className="font-title text-3xl mb-4">Tipografía</h2>
        <h1 className="font-title text-5xl mb-2">H1 - Título principal</h1>
        <h2 className="font-title text-3xl mb-2">H2 - Subtítulo</h2>
        <h3 className="font-title text-xl mb-2">H3 - Título de Sección</h3>
        <p className="font-body text-base mb-2">Texto normal para párrafos.</p>
        <p className="font-body text-sm text-stone-700 mb-2">Esta es una nota o texto secundario.</p>
        <p className="font-body text-xs uppercase tracking-wide text-stone-500">Categoría</p>
      </section>

      <section>
        <h2 className="font-title text-3xl mb-4">Botones</h2>
        <div className="flex flex-wrap items-start gap-6">
          <Button variant="primary">Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="dangerous">Peligroso</Button>
          <Button isLoading>Cargando</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </section>

      <section>
        <h2 className="font-title text-3xl mb-4">Inputs</h2>
        <div className="flex flex-col gap-6 max-w-md">
          <Input placeholder="Input Normal" />
          <Input state="error" message="Mensaje de error." defaultValue="Error" />
          <Input state="success" message="Todo bien." defaultValue="Éxito" />
          <Input placeholder="Deshabilitado" disabled />
        </div>
      </section>

      <section>
        <h2 className="font-title text-3xl mb-4">Tarjetas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="primary">
            <h3 className="font-title text-xl mb-2">Ficha de Personaje</h3>
            <p className="font-body text-base">Nombre: Eldrin</p>
            <p className="font-body text-base">Clase: Guerrero</p>
            <p className="font-body text-base">Nivel: 3</p>
          </Card>
          <Card variant="secondary">
            <h3 className="font-title text-xl mb-2">Objeto</h3>
            <p className="font-body text-base">Espada larga</p>
            <p className="font-body text-sm text-stone-700">Daño: 1d8 + Fuerza</p>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="font-title text-3xl mb-4">Tabla</h2>
        <Table headers={tableHeaders} data={tableData} />
      </section>
    </main>
  );
}