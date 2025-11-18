import React from 'react';

type TableHeader = {
  key: string;
  label: string;
};

export interface BaseRecord {
  id?: number | string;
}

type TableProps<T extends BaseRecord> = {
  headers: TableHeader[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRowId?: number | string;
};

export default function Table<T extends BaseRecord>({ 
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
                key={row.id || rowIndex} 
                className={`
                  transition border-b border-stone-200 last:border-0
                  ${isSelected 
                    ? 'bg-bosque text-white' 
                    : 'odd:bg-white even:bg-pergamino hover:bg-bosque text-stone-800 hover:text-white' 
                  }
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {headers.map((header) => {
                  const rawValue = (row as unknown as Record<string, unknown>)[header.key];

                  return (
                    <td key={`${rowIndex}-${header.key}`} className="px-4 py-2">
                      {rawValue as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}