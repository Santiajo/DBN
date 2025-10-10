'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Objeto {
  id: number;
  Name: string;
  Description: string;
}

interface InventarioItem {
  id: number;
  objeto: Objeto;
  cantidad: number;
}

export default function CrafteoPersonajePage() {
  const { id } = useParams(); // <- obtiene el id de la URL
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventario/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Error al cargar inventario');
        const data = await res.json();
        setInventario(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInventario();
  }, [id]);

  if (loading) return <p>Cargando inventario...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Inventario del personaje #{id}</h1>
      {inventario.length === 0 ? (
        <p>No hay objetos en el inventario.</p>
      ) : (
        <ul className="space-y-2">
          {inventario.map((item) => (
            <li key={item.id} className="border rounded p-2">
              <p><strong>{item.objeto.Name}</strong></p>
              <p>Cantidad: {item.cantidad}</p>
              <p className="text-gray-500 text-sm">{item.objeto.Description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
