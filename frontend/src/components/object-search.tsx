'use client';

import { useState, useEffect, useRef } from 'react';
import { Objeto } from '@/types'; 
import Input from '@/components/input';

interface ObjectSearchProps {
  objetosList: Objeto[];
  onObjectSelect: (objectId: string) => void;
  initialObjectName?: string;
  disabled?: boolean;
}

const MAX_RESULTS = 20; 

export default function ObjectSearch({
  objetosList,
  onObjectSelect,
  initialObjectName = '',
  disabled = false,
}: ObjectSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialObjectName);
  const [results, setResults] = useState<Objeto[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(initialObjectName);
  }, [initialObjectName]);
  
  useEffect(() => {
    // Filtramos solo si el dropdown debe verse
    if (!isDropdownVisible) return;

    if (searchTerm.length > 0) {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = objetosList.filter(obj =>
        obj.Name.toLowerCase().includes(lowerTerm)
      );
      setResults(filtered.slice(0, MAX_RESULTS));
    } else {
      setResults(objetosList.slice(0, MAX_RESULTS));
    }
  }, [searchTerm, objetosList, isDropdownVisible]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  const handleSelect = (objeto: Objeto) => {
    setSearchTerm(objeto.Name);
    onObjectSelect(String(objeto.id));
    setIsDropdownVisible(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <Input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsDropdownVisible(true)}
        placeholder="Busca un objeto..."
        disabled={disabled}
        autoComplete="off"
      />
      {isDropdownVisible && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-stone-300 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-custom">
          {results.length > 0 ? (
            results.map(obj => (
              <li
                key={obj.id}
                className="px-4 py-2 cursor-pointer hover:bg-bosque hover:text-white transition-colors text-sm border-b border-stone-100 last:border-0"
                onClick={() => handleSelect(obj)}
              >
                <div className="font-bold">{obj.Name}</div>
                <div className="text-xs opacity-70 flex justify-between">
                    <span>{obj.Type}</span>
                    <span>{obj.Rarity}</span>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-stone-500 italic text-center">
              No se encontraron objetos.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}