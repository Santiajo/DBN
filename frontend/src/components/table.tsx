import React from 'react';

type TableHeader = {
  key: string;
  label: string;
};

type TableProps<T extends object> = {
  headers: TableHeader[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRowId?: number | string; // <--- AGREGADO: Para manejar la selección
};

export default function Table<T extends { id?: number | string }>({ // <--- Extendemos T para asegurar que tenga id
  headers, 
  data, 
  onRowClick, 
  selectedRowId 
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-madera-oscura">
      <table className="min-w-full text-left text-sm font-body">
        <thead className="bg-cuero text-white font-title uppercase">
          <tr>
            {headers.map((header) => (
              <th key={header.key} className="px-4 py-3">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            // Verificamos si es la fila seleccionada
            // Usamos 'as any' para acceder a row.id con seguridad, o forzamos T a tener id arriba
            const isSelected = selectedRowId !== undefined && (row as any).id === selectedRowId;

            return (
              <tr
                key={rowIndex}
                className={`
                  transition border-b border-stone-200 last:border-0
                  ${isSelected 
                    ? 'bg-bosque text-white' // Estilo para seleccionado (Fondo Bosque)
                    : 'odd:bg-white even:bg-pergamino hover:bg-bosque/10 text-stone-800' // Estilo normal/hover
                  }
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header.key}`} className="px-4 py-2">
                    {row[header.key as keyof T] as React.ReactNode}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}