import React from 'react';

type TableHeader = {
  key: string;    
  label: string;   
};

type TableProps = {
  headers: TableHeader[];
  data: Record<string, React.ReactNode>[];
};

export default function Table({ headers, data }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl shadow-lg border border-madera-oscura">
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
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="odd:bg-white even:bg-pergamino hover:bg-bosque hover:text-white transition"
            >
              {headers.map((header) => (
                <td key={`${rowIndex}-${header.key}`} className="px-4 py-2">
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}