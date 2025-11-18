import React from 'react';

type TableHeader = {
  key: string;
  label: string;
};

interface TableRow {
  id?: number | string;
  [key: string]: any; 
}

type TableProps<T extends TableRow> = {
  headers: TableHeader[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRowId?: number | string;
};

export default function Table<T extends TableRow>({ 
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
            const isSelected = selectedRowId !== undefined && row.id === selectedRowId;

            return (
              <tr
                key={row.id || rowIndex} // Usamos ID como key si existe, si no el index
                className={`
                  transition border-b border-stone-200 last:border-0
                  ${isSelected 
                    ? 'bg-bosque text-white' 
                    : 'odd:bg-white even:bg-pergamino hover:bg-bosque/10 text-stone-800'
                  }
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header.key}`} className="px-4 py-2">
                    {/* 4. TypeScript permite esto gracias a [key: string]: any en TableRow */}
                    {row[header.key] as React.ReactNode}
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