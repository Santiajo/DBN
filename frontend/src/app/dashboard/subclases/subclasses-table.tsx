'use client';

import { DnDSubclass } from '@/types';

interface SubclassesTableProps {
  data: DnDSubclass[];
  onRowClick: (subclass: DnDSubclass) => void;
  selectedId?: number;
}

export default function SubclassesTable({ data, onRowClick, selectedId }: SubclassesTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-madera-oscura">
      <table className="min-w-full text-left text-sm font-body">
        <thead className="bg-cuero text-white font-title uppercase">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Clase Padre</th>
            <th className="px-4 py-3">Fuente</th>
          </tr>
        </thead>
        <tbody>
          {data.map((subclass, rowIndex) => {
            const isSelected = selectedId === subclass.id;
            return (
              <tr
                key={subclass.id || rowIndex}
                onClick={() => onRowClick(subclass)}
                className={`
                  transition border-b border-stone-200 last:border-0 cursor-pointer
                  ${isSelected 
                    ? 'bg-bosque text-white' 
                    : 'odd:bg-white even:bg-pergamino hover:bg-bosque text-stone-800 hover:text-white'
                  }
                `}
              >
                <td className="px-4 py-2 font-semibold">{subclass.name}</td>
                <td className="px-4 py-2">
                    {/* Mostramos el nombre de la clase padre si viene en el serializer */}
                    {subclass.dnd_class_name || 'Desconocida'}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs border border-stone-300 ${isSelected ? 'bg-white/20' : 'bg-stone-200/50'}`}>
                    {subclass.source}
                  </span>
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-stone-500 italic bg-white">
                No se encontraron subclases.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}