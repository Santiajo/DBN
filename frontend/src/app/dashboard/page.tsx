import Card from "@/components/card";

export default function DashboardPage() {
  return (
    <Card variant="secondary">
      <h2 className="font-title text-2xl mb-4">Bienvenido a West March</h2>
      <p className="font-body">
        Aquí aparecerá el contenido principal: fichas de personaje, inventario, misiones y más.
      </p>
    </Card>
  );
}