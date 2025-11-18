'use client';

import { DnDClass } from '@/types';

interface ClassesTableProps {
  data: DnDClass[];
  onRowClick: (dndClass: DnDClass) => void;
  selectedId?: number;
}

export default function ClassesTable({ data, onRowClick, selectedId }: ClassesTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-madera-oscura">
      <table className="min-w-full text-left text-sm font-body">
        {/* Encabezado con color Cuero */}
        <thead className="bg-cuero text-white font-title uppercase">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Dado de Golpe</th>
            <th className="px-4 py-3">Habilidad Principal</th>
            <th className="px-4 py-3">Fuente</th>
          </tr>
        </thead>
        
        {/* Cuerpo de la tabla */}
        <tbody>
          {data.map((dndClass, rowIndex) => {
            const isSelected = selectedId === dndClass.id;

            return (
              <tr
                key={dndClass.id || rowIndex}
                onClick={() => onRowClick(dndClass)}
                className={`
                  transition border-b border-stone-200 last:border-0 cursor-pointer
                  ${isSelected 
                    ? 'bg-bosque text-white' // Seleccionado
                    : 'odd:bg-white even:bg-pergamino hover:bg-bosque/10 text-stone-800' // Normal
                  }
                `}
              >
                <td className="px-4 py-2 font-semibold">
                  {dndClass.name}
                </td>
                <td className="px-4 py-2">
                  d{dndClass.hit_die}
                </td>
                <td className="px-4 py-2 capitalize">
                  {dndClass.primary_ability}
                </td>
                <td className="px-4 py-2">
                  <span className="inline-block bg-stone-200/50 px-2 py-0.5 rounded text-xs border border-stone-300">
                    {dndClass.source}
                  </span>
                </td>
              </tr>
            );
          })}
          
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-stone-500 italic bg-white">
                No se encontraron clases.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}